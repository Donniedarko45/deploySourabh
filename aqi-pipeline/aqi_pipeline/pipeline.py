"""Pipeline stages and orchestration.

Each stage reads the previous stage's output from storage and writes its own, keyed by city
and run time (as_of). Stages can therefore run separately (as Airflow tasks), re-running one
is idempotent, and a run can be replayed for any past hour (backfill).

    ingest -> validate (contract, source health, clean, AQI, gate) -> features
           -> monitor -> train (only when needed) -> forecast

Storage layout under storage_root:
    bronze/<city>/batch_<tag>.csv (+ .meta.json)   raw batches exactly as received, never edited
    silver/<city>/observations_<tag>.csv           merged, standardised history (snapshot, pre-cleaning)
    silver/<city>/clean_<tag>.csv                  standardised, cleaned hourly data with AQI
    gold/<city>/features_<tag>.csv                 model features
    models/<city>/<version>/, champion.json, registry.json
    reports/<city>/dq_<tag>.json|.md, monitor_<tag>.json, run_<tag>.json
    forecasts/<city>/forecast_<tag>.json, latest.json, predictions_log.csv
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import pandas as pd

from . import aqi as aqi_mod
from . import cleaning, features, forecast, modeling, monitoring, quality, sources
from .standardize import standardize

log = logging.getLogger(__name__)
STAGES = ["ingest", "validate", "features", "monitor", "train", "forecast"]


def normalise_as_of(value: str | pd.Timestamp | None) -> pd.Timestamp:
    ts = pd.Timestamp.now(tz="UTC") if value is None else pd.Timestamp(value)
    ts = ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")
    return ts.floor("h")


@dataclass
class RunContext:
    cfg: dict[str, Any]
    city: str
    as_of: pd.Timestamp

    @classmethod
    def create(cls, cfg: dict[str, Any], city: str, as_of=None) -> "RunContext":
        return cls(cfg, city, normalise_as_of(as_of))

    @property
    def city_cfg(self) -> dict[str, Any]:
        return self.cfg["cities"][self.city]

    @property
    def tag(self) -> str:
        return self.as_of.strftime("%Y%m%dT%H%MZ")

    @property
    def horizon(self) -> int:
        return max(int(h) for h in self.cfg["horizons_hours"])

    @property
    def window_start(self) -> pd.Timestamp:
        return self.as_of - pd.Timedelta(days=self.cfg["history_days"])

    @property
    def window_end(self) -> pd.Timestamp:
        return self.as_of + pd.Timedelta(hours=self.horizon)

    def dir(self, layer: str) -> Path:
        path = Path(self.cfg["_base_dir"]) / self.cfg["storage_root"] / layer / self.city
        path.mkdir(parents=True, exist_ok=True)
        return path


def _write_csv(df: pd.DataFrame, path: Path) -> None:
    df.to_csv(path, index_label="time", date_format="%Y-%m-%dT%H:%M:%S%z")


def _read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"{path} not found; run the earlier stages for this as_of first")
    df = pd.read_csv(path, index_col="time")
    df.index = pd.DatetimeIndex(pd.to_datetime(df.index, utc=True), name="time")
    return df


def _write_json(data: Any, path: Path) -> Path:
    path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
    return path


def _tag_time(path: Path) -> pd.Timestamp:
    return pd.to_datetime(path.name.split("_")[1].split(".")[0], format="%Y%m%dT%H%MZ", utc=True)


def _bronze_batches(ctx: RunContext) -> list[tuple[pd.Timestamp, Path]]:
    """Batches fetched at or before this run's time, oldest first. Later ones are invisible,
    so a backfill never sees data from its own future."""
    found = []
    for meta_path in ctx.dir("bronze").glob("batch_*.meta.json"):
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        if meta["source"] != ctx.cfg["source"]:
            raise ValueError(f"{ctx.dir('bronze')} holds {meta['source']} data; use another storage_root "
                             f"for source {ctx.cfg['source']}")
        if _tag_time(meta_path) <= ctx.as_of and not meta.get("quarantined"):
            found.append((_tag_time(meta_path), meta_path))
    return sorted(found)


def _read_batch(meta_path: Path) -> pd.DataFrame:
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    return standardize(pd.read_csv(meta_path.with_name(meta_path.name.replace(".meta.json", ".csv"))),
                       meta["units"])


def _observation_history(ctx: RunContext) -> tuple[pd.DataFrame, int]:
    """Standardised, merged (not yet cleaned) history visible at this run: the newest earlier
    snapshot plus the batches fetched since, or every bronze batch if there is no snapshot.
    Merging keeps the newest non-missing value, so both routes give the same result."""
    snapshots = [(t, p) for p in ctx.dir("silver").glob("observations_*.csv") if (t := _tag_time(p)) < ctx.as_of]
    frames, since = [], None
    if snapshots:
        since, path = max(snapshots)
        frames.append(_read_csv(path))
    frames += [_read_batch(p) for t, p in _bronze_batches(ctx) if since is None or t > since]
    history = cleaning.merge_batches(frames)
    history = history[history.index >= ctx.window_start]
    _write_csv(history, ctx.dir("silver") / f"observations_{ctx.tag}.csv")
    return history, len(frames)


# --------------------------------------------------------------------------- stages


def stage_ingest(ctx: RunContext) -> dict[str, Any]:
    start = ctx.window_start
    earlier = [p for t, p in _bronze_batches(ctx) if t < ctx.as_of]
    if earlier:  # incremental: only re-fetch the overlap since the last observation
        last = max(pd.Timestamp(json.loads(p.read_text())["last_observed"] or start) for p in earlier)
        start = max(start, last - pd.Timedelta(hours=ctx.cfg["overlap_hours"]))
    batch = sources.fetch(ctx.cfg, ctx.city_cfg, start, ctx.as_of, ctx.window_end)

    path = ctx.dir("bronze") / f"batch_{ctx.tag}.csv"
    batch.frame.to_csv(path, index=False)
    times = pd.to_datetime(batch.frame["time"], utc=True, errors="coerce")
    observed = times[batch.frame["pm2_5"].notna()] if "pm2_5" in batch.frame else times.iloc[:0]
    meta = {
        "city": ctx.city, "as_of": ctx.as_of.isoformat(), "source": batch.source,
        "start": start.isoformat(), "end": ctx.window_end.isoformat(),
        "fetched_at": pd.Timestamp.now(tz="UTC").isoformat(), "rows": len(batch.frame),
        "last_observed": observed.max().isoformat() if len(observed) else None,
        "units": batch.units, "request": batch.request,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
    _write_json(meta, path.with_suffix(".meta.json"))
    log.info("ingested %s rows (%s to %s, %s)", len(batch.frame), start, ctx.window_end,
             "incremental" if earlier else "full history")
    return {"rows": len(batch.frame), "start": start.isoformat(), "incremental": bool(earlier)}


def stage_validate(ctx: RunContext) -> dict[str, Any]:
    q = ctx.cfg["quality"]
    report_path = ctx.dir("reports") / f"dq_{ctx.tag}.json"
    meta_path = ctx.dir("bronze") / f"batch_{ctx.tag}.meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"{meta_path} not found; run ingest first")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    raw = pd.read_csv(meta_path.with_name(f"batch_{ctx.tag}.csv"))

    def finish(checks, cleaning_stats=None):
        report = quality.build_report(checks, city=ctx.city, as_of=ctx.as_of, source=meta["source"],
                                      cleaning=cleaning_stats)
        quality.write_report(report, report_path)
        if not report["gate_passed"]:
            raise quality.QualityGateError(
                f"quality gate failed for {ctx.city}: {', '.join(report['failed_critical'])}", report_path)
        return report

    def quarantine_if_broken(checks):
        """A batch that breaks the contract stays in bronze for inspection but is never merged."""
        broken = [c.name for c in checks if c.severity == quality.CRITICAL and not c.passed]
        if broken:
            meta["quarantined"] = broken
            _write_json(meta, meta_path)
            finish(checks)

    checks = quality.contract_checks(raw, meta["units"])
    quarantine_if_broken(checks)
    batch = standardize(raw, meta["units"])
    checks += quality.source_health_checks(batch, q, ctx.as_of)
    quarantine_if_broken(checks)

    history, merged = _observation_history(ctx)
    clean, stats = cleaning.clean(history, q, ctx.as_of, ctx.window_start, ctx.window_end)
    stats["duplicates_in_batch"] = int(batch.index.duplicated().sum())
    stats["inputs_merged"] = merged
    aqi = aqi_mod.compute_aqi(clean)
    aqi.loc[aqi.index > ctx.as_of] = None
    silver = clean.join(aqi)
    checks += quality.fitness_checks(silver, q, ctx.as_of, ctx.horizon)
    report = finish(checks, stats)

    _write_csv(silver, ctx.dir("silver") / f"clean_{ctx.tag}.csv")
    log.info("data quality score %.1f/100, gate passed (%d warnings)", report["quality_score"],
             len(report["warnings"]))
    return {"quality_score": report["quality_score"], "warnings": report["warnings"],
            "report": str(report_path.with_suffix(".md"))}


def stage_features(ctx: RunContext) -> dict[str, Any]:
    silver = _read_csv(ctx.dir("silver") / f"clean_{ctx.tag}.csv")
    base = features.base_features(silver, ctx.city_cfg["timezone"])
    _write_csv(base, ctx.dir("gold") / f"features_{ctx.tag}.csv")
    return {"rows": len(base), "columns": base.shape[1]}


def stage_monitor(ctx: RunContext) -> dict[str, Any]:
    base = _read_csv(ctx.dir("gold") / f"features_{ctx.tag}.csv")
    champion = modeling.load_champion(ctx.dir("models"))
    report = monitoring.monitor(base, champion, ctx.cfg, ctx.as_of,
                                ctx.dir("forecasts") / "predictions_log.csv")
    _write_json(report, ctx.dir("reports") / f"monitor_{ctx.tag}.json")
    if report.get("drifted_features"):
        log.warning("input drift vs the same weeks last year: %s", ", ".join(report["drifted_features"]))
    log.info("monitoring: %s", "; ".join(report["reasons"]) or "champion healthy, no retraining needed")
    return {"retrain": report["retrain"], "reasons": report["reasons"],
            "live_accuracy": report.get("live_accuracy", {})}


def stage_train(ctx: RunContext, force: bool = False) -> dict[str, Any]:
    monitor_path = ctx.dir("reports") / f"monitor_{ctx.tag}.json"
    decision = json.loads(monitor_path.read_text()) if monitor_path.exists() else {"retrain": True}
    if not (force or decision["retrain"]):
        return {"trained": False}
    base = _read_csv(ctx.dir("gold") / f"features_{ctx.tag}.csv")
    dq = json.loads((ctx.dir("reports") / f"dq_{ctx.tag}.json").read_text())
    entry = modeling.train(base, ctx.cfg, ctx.as_of, ctx.city_cfg["timezone"], ctx.dir("models"),
                           dq["quality_score"])
    return {"trained": True, "version": entry["version"], "promoted": entry["promoted"],
            "metrics": {h: {k: v[k] for k in ("mae", "persistence_mae", "skill_vs_persistence",
                                               "category_accuracy")} for h, v in entry["horizons"].items()}}


def stage_forecast(ctx: RunContext) -> dict[str, Any]:
    champion = modeling.load_champion(ctx.dir("models"))
    base = _read_csv(ctx.dir("gold") / f"features_{ctx.tag}.csv")
    silver = _read_csv(ctx.dir("silver") / f"clean_{ctx.tag}.csv")
    dq = json.loads((ctx.dir("reports") / f"dq_{ctx.tag}.json").read_text())
    result = forecast.make_forecast(base, silver, champion, ctx.cfg, ctx.city_cfg, ctx.as_of,
                                    dq["quality_score"])
    result["alerts"] = forecast.alert(result, ctx.cfg)
    out = ctx.dir("forecasts")
    _write_json(result, out / f"forecast_{ctx.tag}.json")
    _write_json(result, out / "latest.json")
    forecast.append_log(out / "predictions_log.csv", result)
    _prune(ctx)
    for f in result["forecasts"]:
        log.info("+%2sh  %s  AQI %3s  %-12s (%s)", f["horizon_h"], f["valid_at_local"], f["aqi"], f["category"],
                 f["method"])
    return result


def _prune(ctx: RunContext) -> None:
    """Silver and gold hold a full history per run; keep only the newest few. Bronze can
    rebuild them, so nothing is lost."""
    keep = int(ctx.cfg.get("keep_runs", 5))
    for layer, pattern in (("silver", "clean_*.csv"), ("silver", "observations_*.csv"), ("gold", "features_*.csv")):
        for old in sorted(ctx.dir(layer).glob(pattern))[:-keep]:
            old.unlink()


STAGE_FUNCS: dict[str, Callable[..., dict[str, Any]]] = {
    "ingest": stage_ingest, "validate": stage_validate, "features": stage_features,
    "monitor": stage_monitor, "train": stage_train, "forecast": stage_forecast,
}


def run_stage(name: str, ctx: RunContext, **kwargs) -> dict[str, Any]:
    return STAGE_FUNCS[name](ctx, **kwargs)


def run(ctx: RunContext, force_train: bool = False) -> dict[str, Any]:
    """Run every stage in order. Writes a run summary even when a stage fails."""
    summary: dict[str, Any] = {"city": ctx.city, "as_of": ctx.as_of.isoformat(), "source": ctx.cfg["source"],
                               "status": "running", "stages": {}}
    log.info("=== %s, run time %s (%s) ===", ctx.city_cfg["name"], ctx.as_of, ctx.cfg["source"])
    try:
        for name in STAGES:
            started = time.perf_counter()
            kwargs = {"force": force_train} if name == "train" else {}
            output = run_stage(name, ctx, **kwargs)
            summary["stages"][name] = {"status": "ok", "seconds": round(time.perf_counter() - started, 2),
                                       "output": output}
        summary["status"] = "success"
    except Exception as exc:
        summary["status"] = "failed"
        summary["error"] = f"{type(exc).__name__}: {exc}"
        summary["stages"][name] = {"status": "failed", "seconds": round(time.perf_counter() - started, 2)}
        raise
    finally:
        _write_json(summary, ctx.dir("reports") / f"run_{ctx.tag}.json")
    return summary
