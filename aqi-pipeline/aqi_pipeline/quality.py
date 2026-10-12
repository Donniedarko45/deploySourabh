"""Data quality checks, grouped by the quality dimension each one protects.

Three layers:
1. contract_checks: the new raw batch must have the expected columns, parseable timestamps
   and known units. Failure stops the run before anything is written downstream.
2. source_health_checks: problems in the new batch (duplicates, impossible values, stuck
   sensors, spikes, gaps). Cleaning repairs these, so they are warnings, recorded so a bad
   feed is noticed.
3. fitness_checks: the cleaned history the model will use must be complete, consistent,
   fresh and long enough. These form the quality gate: any critical failure stops the run.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .sources import RAW_COLUMNS
from .standardize import CANONICAL, COLUMNS, POLLUTANTS, UnitError, conversion_factor

CRITICAL, WARNING = "critical", "warning"


class QualityGateError(RuntimeError):
    def __init__(self, message: str, report_path: Path | None = None):
        super().__init__(message)
        self.report_path = report_path


@dataclass
class Check:
    name: str
    dimension: str
    severity: str
    passed: bool
    metric: float | None
    threshold: float | None
    detail: str
    layer: str = ""


def _check(name, dimension, severity, metric, threshold, detail, *, lower_is_better=True) -> Check:
    if metric is None or (isinstance(metric, float) and np.isnan(metric)):
        passed = False
    else:
        passed = metric <= threshold if lower_is_better else metric >= threshold
    metric = None if metric is None else round(float(metric), 4)
    return Check(name, dimension, severity, bool(passed), metric, threshold, detail)


def _layer(checks: list[Check], layer: str) -> list[Check]:
    for c in checks:
        c.layer = layer
    return checks


# ---------------------------------------------------------------- shared measurements


def flatline_mask(s: pd.Series, hours: int) -> pd.Series:
    """True for readings that repeat the previous value inside a run of >= `hours` identical values."""
    same = s.eq(s.shift())
    run_id = (~same).cumsum()
    run_len = s.groupby(run_id).transform("size")
    return same & (run_len >= hours) & s.notna()


def spike_mask(s: pd.Series, threshold: float, neighbour_ratio: float) -> pd.Series:
    """Isolated single-hour spikes (Hampel filter plus a neighbour test).

    Genuine pollution events (fireworks, dust storms) build over several hours, so a reading
    is a spike only if it is far above the local median *and* several times both neighbours.
    """
    med = s.rolling(25, center=True, min_periods=6).median()
    mad = (s - med).abs().rolling(25, center=True, min_periods=6).median()
    scale = (1.4826 * mad).clip(lower=0.05 * med.abs() + 1e-6)
    robust_z = (s - med) / scale
    neighbours = pd.concat([s.shift(1), s.shift(-1)], axis=1).max(axis=1)
    return (robust_z > threshold) & (s > neighbour_ratio * neighbours)


def longest_gap_hours(s: pd.Series, grid: pd.DatetimeIndex) -> int:
    isna = s.reindex(grid).isna()
    if not isna.any():
        return 0
    run_id = (isna != isna.shift()).cumsum()
    return int(isna.groupby(run_id).sum().max())


# ---------------------------------------------------------------- layer 1: contract


def contract_checks(raw: pd.DataFrame, units: dict[str, str]) -> list[Check]:
    checks = []
    missing = [c for c in RAW_COLUMNS if c not in raw.columns]
    checks.append(_check("schema_columns", "validity", CRITICAL, len(missing), 0,
                         f"missing columns: {missing}" if missing else "all expected columns present"))
    times = pd.to_datetime(raw["time"], utc=True, errors="coerce") if "time" in raw else pd.Series(dtype=object)
    bad_times = int(times.isna().sum()) if len(times) else len(raw)
    checks.append(_check("timestamps_parse", "standardisation", CRITICAL, bad_times, 0,
                         f"{bad_times} unparseable timestamps (stored as UTC)"))
    bad_units = []
    for raw_name in CANONICAL:
        if raw_name in raw.columns:
            try:
                conversion_factor(raw_name, units.get(raw_name))
            except UnitError:
                bad_units.append(f"{raw_name}={units.get(raw_name)!r}")
    checks.append(_check("units_known", "standardisation", CRITICAL, len(bad_units), 0,
                         f"unknown units: {bad_units}" if bad_units else "all units convertible"))
    checks.append(_check("batch_not_empty", "completeness", CRITICAL, len(raw), 1,
                         f"{len(raw)} rows received", lower_is_better=False))
    return _layer(checks, "contract")


# ---------------------------------------------------------------- layer 2: source health


def source_health_checks(batch: pd.DataFrame, q: dict[str, Any], as_of: pd.Timestamp) -> list[Check]:
    """`batch` is standardised (index = time) but not cleaned."""
    obs = batch[batch.index <= as_of]
    checks = []
    n = max(len(obs), 1)

    dupes = int(obs.index.duplicated().sum())
    checks.append(_check("duplicate_timestamps", "consistency", WARNING, dupes / n,
                         q["max_duplicate_fraction"], f"{dupes} repeated timestamps"))
    checks.append(_check("time_ordered", "consistency", WARNING, int(not obs.index.is_monotonic_increasing), 0,
                         "rows arrive in time order" if obs.index.is_monotonic_increasing else "rows out of order"))

    unique = obs[~obs.index.duplicated(keep="last")].sort_index()
    grid = pd.date_range(unique.index.min(), as_of, freq="h") if len(unique) else pd.DatetimeIndex([])
    for col in COLUMNS:
        s = unique[col].reindex(grid)
        missing = float(s.isna().mean()) if len(grid) else 1.0
        checks.append(_check(f"missing_{col}", "completeness", WARNING, missing, q["max_missing_fraction"],
                             f"{missing:.1%} of hours missing"))
    for col in ("pm25", "pm10"):
        gap = longest_gap_hours(unique[col], grid) if len(grid) else 0
        checks.append(_check(f"longest_gap_{col}", "completeness", WARNING, gap, q["max_gap_hours"],
                             f"longest gap {gap} h"))

    for col, (lo, hi) in q["ranges"].items():
        s = obs[col].dropna()
        bad = int((~s.between(lo, hi)).sum())
        checks.append(_check(f"range_{col}", "accuracy", WARNING, bad / max(len(s), 1),
                             q["max_out_of_range_fraction"], f"{bad} values outside [{lo}, {hi}]"))

    both = obs[["pm25", "pm10"]].dropna()
    both = both[(both >= 0).all(axis=1)]
    inconsistent = int((both["pm25"] > both["pm10"]).sum())
    checks.append(_check("pm25_not_above_pm10", "consistency", WARNING, inconsistent / max(len(both), 1),
                         q["max_pm_inconsistency_fraction"],
                         f"{inconsistent} rows where PM2.5 > PM10 (PM2.5 is a subset of PM10)"))

    co = unique["co"][unique["co"] > 0]
    lo, hi = q["co_median_range_mg"]
    median = float(co.median()) if len(co) else float("nan")
    checks.append(Check("co_unit_plausible", "accuracy", CRITICAL, bool(lo <= median <= hi) if len(co) else True,
                        None if np.isnan(median) else round(median, 3), None,
                        f"median CO {median:.3f} mg/m³, expected {lo}-{hi}; outside means a unit mix-up"))

    for col in POLLUTANTS:
        s = unique[col]
        stuck = int(flatline_mask(s, q["flatline_hours"]).sum())
        checks.append(_check(f"flatline_{col}", "reliability", WARNING, stuck / max(s.notna().sum(), 1),
                             q["max_flatline_fraction"],
                             f"{stuck} readings repeated for {q['flatline_hours']}+ hours (stuck sensor)"))
        spikes = int(spike_mask(s.reindex(grid), q["spike_threshold"], q["spike_neighbour_ratio"]).sum())
        checks.append(_check(f"spikes_{col}", "accuracy", WARNING, spikes / max(s.notna().sum(), 1),
                             q["max_spike_fraction"], f"{spikes} isolated single-hour spikes"))
    return _layer(checks, "source_health")


# ---------------------------------------------------------------- layer 3: fitness gate


def fitness_checks(silver: pd.DataFrame, q: dict[str, Any], as_of: pd.Timestamp,
                   horizon: int) -> list[Check]:
    """`silver` is the cleaned hourly history with AQI, including forecast-weather rows."""
    obs = silver[silver.index <= as_of]
    checks = []

    checks.append(_check("unique_hourly_grid", "consistency", CRITICAL,
                         int(silver.index.duplicated().sum()) + int(not silver.index.is_monotonic_increasing)
                         + int(pd.infer_freq(silver.index[:48]) not in ("h", "H")), 0,
                         "one row per hour, in order"))
    bad = 0
    for col, (lo, hi) in q["ranges"].items():
        s = silver[col].dropna()
        bad += int((~s.between(lo, hi)).sum())
    checks.append(_check("all_values_in_range", "accuracy", CRITICAL, bad, 0, f"{bad} values out of range"))
    pm = obs[["pm25", "pm10"]].dropna()
    inconsistent = int((pm["pm25"] > pm["pm10"]).sum())
    checks.append(_check("pm_consistent", "consistency", CRITICAL, inconsistent, 0,
                         f"{inconsistent} rows with PM2.5 > PM10"))

    for col in POLLUTANTS:
        missing = float(obs[col].isna().mean())
        severity = CRITICAL if col in ("pm25", "pm10") else WARNING
        checks.append(_check(f"complete_{col}", "completeness", severity, missing,
                             q["max_missing_fraction_clean"], f"{missing:.1%} missing after cleaning"))
    coverage = float(obs["aqi"].notna().mean())
    checks.append(_check("aqi_coverage", "completeness", CRITICAL, coverage, q["min_aqi_coverage"],
                         f"AQI computable for {coverage:.1%} of hours", lower_is_better=False))
    days = float(obs["aqi"].notna().sum() / 24)
    checks.append(_check("history_length_days", "completeness", CRITICAL, days, q["min_history_days"],
                         f"{days:.0f} days of AQI history", lower_is_better=False))

    # Fresh PM readings are not enough: an outage can leave too few hours for the 24 h average.
    for col, label in (("pm25", "PM2.5 reading"), ("aqi", "computable AQI")):
        last = obs[col].last_valid_index()
        staleness = (as_of - last) / pd.Timedelta(hours=1) if last is not None else None
        checks.append(_check(f"freshness_{col}", "timeliness", CRITICAL, staleness, q["max_staleness_hours"],
                             f"latest {label} {last}" if last is not None else f"no {label}"))

    future = silver[(silver.index > as_of) & (silver.index <= as_of + pd.Timedelta(hours=horizon))]
    wx_missing = float(future[["temp_c", "wind_ms", "rh_pct"]].isna().mean().mean()) if len(future) else 1.0
    checks.append(_check("forecast_weather_available", "completeness", WARNING, wx_missing, 0.1,
                         f"{wx_missing:.1%} of forecast weather missing for the next {horizon} h"))
    return _layer(checks, "fitness_gate")


# ---------------------------------------------------------------- report


def build_report(checks: list[Check], *, city: str, as_of: pd.Timestamp, source: str,
                 cleaning: dict[str, Any] | None = None) -> dict[str, Any]:
    weights = {CRITICAL: 2, WARNING: 1}
    total = sum(weights[c.severity] for c in checks)
    score = 100 * sum(weights[c.severity] for c in checks if c.passed) / total if total else 0.0
    failed_critical = [c.name for c in checks if c.severity == CRITICAL and not c.passed]
    by_dimension: dict[str, dict[str, int]] = {}
    for c in checks:
        d = by_dimension.setdefault(c.dimension, {"passed": 0, "failed": 0})
        d["passed" if c.passed else "failed"] += 1
    return {
        "city": city,
        "as_of": as_of.isoformat(),
        "source": source,
        "quality_score": round(score, 1),
        "gate_passed": not failed_critical,
        "failed_critical": failed_critical,
        "warnings": [c.name for c in checks if c.severity == WARNING and not c.passed],
        "by_dimension": by_dimension,
        "cleaning": cleaning or {},
        "checks": [asdict(c) for c in checks],
    }


def write_report(report: dict[str, Any], json_path: Path) -> Path:
    json_path.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
    lines = [
        f"# Data quality report: {report['city']} at {report['as_of']}",
        "",
        f"Source: `{report['source']}`. Quality score: **{report['quality_score']}/100**. "
        f"Gate: **{'PASSED' if report['gate_passed'] else 'FAILED'}**.",
        "",
        "| Layer | Check | Dimension | Severity | Result | Metric | Detail |",
        "|---|---|---|---|---|---|---|",
    ]
    for c in report["checks"]:
        result = "pass" if c["passed"] else ("FAIL" if c["severity"] == CRITICAL else "warn")
        lines.append(f"| {c['layer']} | {c['name']} | {c['dimension']} | {c['severity']} | {result} | "
                     f"{'' if c['metric'] is None else c['metric']} | {c['detail']} |")
    if report["cleaning"]:
        lines += ["", "## Cleaning applied", "", "```json", json.dumps(report["cleaning"], indent=2), "```"]
    json_path.with_suffix(".md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path
