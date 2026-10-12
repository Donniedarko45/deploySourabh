import numpy as np
import pandas as pd
import pytest

from aqi_pipeline.cleaning import clean, merge_batches
from aqi_pipeline.config import load_config
from aqi_pipeline.quality import contract_checks, flatline_mask, source_health_checks, spike_mask
from aqi_pipeline.sources import OPEN_METEO_UNITS, RAW_COLUMNS
from aqi_pipeline.standardize import UnitError, standardize

Q = load_config()["quality"]
AS_OF = pd.Timestamp("2026-01-03 00:00", tz="UTC")


def _raw(hours=49):
    times = pd.date_range("2026-01-01", periods=hours, freq="h", tz="UTC")
    rng = np.random.default_rng(0)
    noise = lambda scale: rng.normal(0, scale, hours)  # noqa: E731  real sensors never repeat exactly
    pm25 = 80 + 10 * np.sin(np.arange(hours) / 4) + noise(2)
    return pd.DataFrame({
        "time": times.strftime("%Y-%m-%dT%H:%M"),
        "pm2_5": pm25, "pm10": pm25 * 1.8, "carbon_monoxide": 1200 + noise(50),
        "nitrogen_dioxide": 40 + noise(2), "sulphur_dioxide": 10 + noise(0.5), "ozone": 30 + noise(1),
        "temperature_2m": 15.0, "relative_humidity_2m": 70.0, "wind_speed_10m": 7.2,
        "wind_direction_10m": 300.0, "precipitation": 0.0, "surface_pressure": 990.0,
    })


def _names(checks, passed=False):
    return {c.name for c in checks if c.passed is passed}


def test_standardize_converts_declared_units():
    raw = _raw()
    out = standardize(raw, OPEN_METEO_UNITS)
    assert out["co"].iloc[0] == pytest.approx(raw["carbon_monoxide"].iloc[0] / 1000)  # µg/m³ -> mg/m³
    assert out["wind_ms"].iloc[0] == pytest.approx(2.0)   # km/h -> m/s
    assert str(out.index.tz) == "UTC"


def test_unknown_unit_is_rejected():
    units = {**OPEN_METEO_UNITS, "wind_speed_10m": "furlongs/fortnight"}
    with pytest.raises(UnitError):
        standardize(_raw(), units)
    checks = contract_checks(_raw(), units)
    assert "units_known" in _names(checks)


def test_contract_flags_missing_columns():
    checks = contract_checks(_raw().drop(columns=["ozone"]), OPEN_METEO_UNITS)
    assert "schema_columns" in _names(checks)
    assert set(RAW_COLUMNS) - {"ozone"} <= set(_raw().columns)


def test_clean_data_passes_source_health():
    checks = source_health_checks(standardize(_raw(), OPEN_METEO_UNITS), Q, AS_OF)
    assert _names(checks) == set()


def test_source_health_detects_faults():
    raw = _raw()
    raw.loc[5, "pm2_5"] = -999                                  # sentinel
    raw.loc[10, ["pm2_5", "pm10"]] = [300.0, 100.0]             # PM2.5 > PM10
    raw.loc[20:31, "nitrogen_dioxide"] = 55.5                   # stuck sensor
    raw = pd.concat([raw, raw.iloc[[3]]], ignore_index=True)    # duplicate, out of order
    units = {**OPEN_METEO_UNITS, "carbon_monoxide": "mg/m³"}     # CO mislabelled: 1200 mg/m³
    failed = _names(source_health_checks(standardize(raw, units), Q, AS_OF))
    assert {"duplicate_timestamps", "time_ordered", "range_pm25", "pm25_not_above_pm10",
            "flatline_no2", "co_unit_plausible"} <= failed


def test_flatline_and_spike_masks():
    s = pd.Series([1.0, 2, 3, 3, 3, 3, 4, 5])
    assert flatline_mask(s, 4).tolist() == [False, False, False, True, True, True, False, False]
    values = 50 + np.sin(np.arange(60))
    values[30] = 900
    assert spike_mask(pd.Series(values), 6, 3).sum() == 1
    ramp = pd.Series(np.r_[np.full(30, 50.0), np.full(30, 400.0)])  # a real event persists
    assert spike_mask(ramp, 6, 3).sum() == 0


def test_clean_repairs_and_only_fills_short_gaps():
    batch = standardize(_raw(), OPEN_METEO_UNITS)
    batch.iloc[5, batch.columns.get_loc("pm25")] = -999
    batch.iloc[10:12, batch.columns.get_loc("o3")] = np.nan     # 2 h gap: filled
    batch.iloc[20:30, batch.columns.get_loc("so2")] = np.nan    # 10 h gap: left missing
    newer = batch.iloc[40:].copy()
    newer["no2"] += 1.0                                          # newer batch revises values
    history = merge_batches([batch, newer])
    out, stats = clean(history, Q, AS_OF, batch.index[0], AS_OF)
    assert out.index.is_unique and len(out) == 49
    assert stats["out_of_range_removed"]["pm25"] == 1
    assert out["pm25"].iloc[5] == pytest.approx((out["pm25"].iloc[4] + out["pm25"].iloc[6]) / 2)
    assert out["o3"].iloc[10:12].notna().all()
    assert out["so2"].iloc[20:30].isna().all()
    assert out["no2"].iloc[45] == pytest.approx(batch["no2"].iloc[45] + 1.0)
