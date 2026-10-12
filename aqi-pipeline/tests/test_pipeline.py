"""End-to-end runs on the synthetic source in a temporary store."""

import json

import pandas as pd
import pytest

from aqi_pipeline.config import load_config
from aqi_pipeline.pipeline import RunContext, run, run_stage
from aqi_pipeline.quality import QualityGateError

AS_OF = "2026-03-01T06:00Z"


@pytest.fixture()
def cfg(tmp_path):
    return load_config(source="synthetic", storage_root=str(tmp_path / "store"), history_days=450)


def test_full_run_then_incremental_run(cfg):
    first = run(RunContext.create(cfg, "delhi", AS_OF))
    assert first["status"] == "success"
    assert first["stages"]["train"]["output"]["trained"]
    assert not first["stages"]["ingest"]["output"]["incremental"]

    ctx = RunContext.create(cfg, "delhi", pd.Timestamp(AS_OF) + pd.Timedelta(days=1))
    second = run(ctx)
    assert second["stages"]["ingest"]["output"]["incremental"]
    assert not second["stages"]["train"]["output"]["trained"]   # fresh, healthy champion is reused

    forecast = json.loads((ctx.dir("forecasts") / "latest.json").read_text())
    assert [f["horizon_h"] for f in forecast["forecasts"]] == cfg["horizons_hours"]
    for f in forecast["forecasts"]:
        assert 0 <= f["aqi"] <= 500 and f["category"] and f["method"] in ("model", "persistence")

    monitor = json.loads((ctx.dir("reports") / f"monitor_{ctx.tag}.json").read_text())
    assert monitor["live_accuracy"]["24"]["samples"] == 1      # yesterday's 24 h forecast was scored
    assert (ctx.dir("reports") / f"dq_{ctx.tag}.md").exists()


def test_gate_stops_run_when_data_is_stale(cfg):
    ctx = RunContext.create(cfg, "mumbai", AS_OF)
    run_stage("ingest", ctx)
    batch = ctx.dir("bronze") / f"batch_{ctx.tag}.csv"
    raw = pd.read_csv(batch)
    offline = pd.to_datetime(raw["time"], utc=True) > ctx.as_of - pd.Timedelta(hours=12)
    raw.loc[offline, ["pm2_5", "pm10"]] = None                  # PM sensor offline for 12 hours
    raw.to_csv(batch, index=False)
    with pytest.raises(QualityGateError) as err:
        run_stage("validate", ctx)
    assert "freshness_pm25" in str(err.value) and "freshness_aqi" in str(err.value)
    assert not (ctx.dir("silver") / f"clean_{ctx.tag}.csv").exists()


def test_backfill_cannot_see_later_batches(cfg):
    later = RunContext.create(cfg, "chennai", "2026-03-05T06:00Z")
    run_stage("ingest", later)
    earlier = RunContext.create(cfg, "chennai", AS_OF)
    run_stage("ingest", earlier)
    meta = json.loads((earlier.dir("bronze") / f"batch_{earlier.tag}.meta.json").read_text())
    assert pd.Timestamp(meta["start"]) == earlier.window_start   # full fetch: the later batch was ignored
    assert pd.Timestamp(meta["last_observed"]) <= earlier.as_of


def test_batch_with_unknown_units_is_quarantined(cfg):
    ctx = RunContext.create(cfg, "kolkata", AS_OF)
    run_stage("ingest", ctx)
    meta_path = ctx.dir("bronze") / f"batch_{ctx.tag}.meta.json"
    meta = json.loads(meta_path.read_text())
    meta["units"]["carbon_monoxide"] = "ppm"
    meta_path.write_text(json.dumps(meta))
    with pytest.raises(QualityGateError, match="units_known"):
        run_stage("validate", ctx)
    assert json.loads(meta_path.read_text())["quarantined"] == ["units_known"]

    later = RunContext.create(cfg, "kolkata", pd.Timestamp(AS_OF) + pd.Timedelta(hours=1))
    assert run_stage("ingest", later)["incremental"] is False   # the quarantined batch is ignored


def test_store_refuses_to_mix_sources(cfg):
    ctx = RunContext.create(cfg, "lucknow", AS_OF)
    run_stage("ingest", ctx)
    live = RunContext.create({**cfg, "source": "open_meteo"}, "lucknow", pd.Timestamp(AS_OF) + pd.Timedelta(hours=1))
    with pytest.raises(ValueError, match="storage_root"):
        run_stage("ingest", live)
