import numpy as np
import pandas as pd
import pytest

from aqi_pipeline.aqi import category, category_index, compute_aqi, sub_index


@pytest.mark.parametrize("pollutant, concentration, expected", [
    ("pm25", 30, 50),
    ("pm25", 45, 75),
    ("pm25", 90, 200),
    ("pm25", 250, 400),
    ("pm10", 300, 250),
    ("no2", 130, 150),
    ("so2", 60, 75),
    ("co", 1.5, 75),     # mg/m³
    ("o3", 188, 250),
    ("pm25", 5000, 500),  # capped
])
def test_sub_index_breakpoints(pollutant, concentration, expected):
    assert sub_index([concentration], pollutant)[0] == pytest.approx(expected)


def test_sub_index_keeps_missing_values_missing():
    assert np.isnan(sub_index([np.nan], "pm25")[0])


@pytest.mark.parametrize("aqi, name", [(0, "Good"), (50, "Good"), (51, "Satisfactory"), (150, "Moderate"),
                                       (250, "Poor"), (350, "Very Poor"), (450, "Severe"), (500, "Severe")])
def test_categories(aqi, name):
    assert category(aqi) == name


def test_category_index_marks_missing():
    assert list(category_index([10, 120, np.nan, 499])) == [0, 2, -1, 5]


def _hourly(hours=48, **columns):
    index = pd.date_range("2026-01-01", periods=hours, freq="h", tz="UTC")
    return pd.DataFrame({k: np.full(hours, v, dtype=float) for k, v in columns.items()}, index=index)


def test_aqi_is_max_sub_index_with_prominent_pollutant():
    df = _hourly(pm25=100, pm10=80, no2=20, so2=10, co=0.5, o3=30)
    out = compute_aqi(df)
    last = out.iloc[-1]
    assert last["aqi"] == pytest.approx(233)  # PM2.5 100 µg/m³ -> 233
    assert last["prominent_pollutant"] == "pm25"
    assert last["aqi_category"] == "Poor"


def test_aqi_needs_16_hours_for_daily_average():
    out = compute_aqi(_hourly(pm25=100, pm10=80, no2=20))
    assert out["aqi"].iloc[:15].isna().all()
    assert out["aqi"].iloc[15:].notna().all()


def test_aqi_requires_three_pollutants_including_pm():
    assert compute_aqi(_hourly(pm25=100, pm10=80))["aqi"].isna().all()
    assert compute_aqi(_hourly(no2=50, so2=50, co=1.0, o3=50))["aqi"].isna().all()
