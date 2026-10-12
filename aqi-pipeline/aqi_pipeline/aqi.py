"""Indian National Air Quality Index (CPCB, 2014).

* PM2.5, PM10, NO2 and SO2 use 24-hour averages (at least 16 valid hours).
* CO and O3 use 8-hour averages (at least 6 valid hours), taking the maximum over the last 24 h.
* Each pollutant maps to a sub-index by linear interpolation between breakpoints.
* AQI = the highest sub-index, reported only when at least three pollutants are available
  and one of them is PM2.5 or PM10.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

AQI_POINTS = [0, 50, 100, 200, 300, 400, 500]
# Concentration at each AQI point. The last (Severe) band is extended by the width of the
# band before it, as CPCB's calculator does; sub-indices are capped at 500.
BREAKPOINTS = {
    "pm25": [0, 30, 60, 90, 120, 250, 380],
    "pm10": [0, 50, 100, 250, 350, 430, 510],
    "no2": [0, 40, 80, 180, 280, 400, 520],
    "so2": [0, 40, 80, 380, 800, 1600, 2400],
    "co": [0, 1.0, 2.0, 10, 17, 34, 51],  # mg/m³
    "o3": [0, 50, 100, 168, 208, 748, 1287],
}
DAILY_MEAN = ["pm25", "pm10", "no2", "so2"]
EIGHT_HOUR = ["co", "o3"]

CATEGORIES = [
    (50, "Good", "Minimal impact."),
    (100, "Satisfactory", "Minor breathing discomfort to sensitive people."),
    (200, "Moderate", "Breathing discomfort to people with lung disease such as asthma, and to "
                      "people with heart disease, children and older adults."),
    (300, "Poor", "Breathing discomfort to most people on prolonged exposure."),
    (400, "Very Poor", "Respiratory illness on prolonged exposure."),
    (500, "Severe", "Affects healthy people and seriously impacts those with existing diseases."),
]
CATEGORY_NAMES = [name for _, name, _ in CATEGORIES]


def sub_index(concentration, pollutant: str) -> np.ndarray:
    values = np.asarray(concentration, dtype=float)
    out = np.interp(values, BREAKPOINTS[pollutant], AQI_POINTS)
    return np.where(np.isnan(values), np.nan, out)


def category(aqi: float) -> str | None:
    if aqi is None or np.isnan(aqi):
        return None
    for upper, name, _ in CATEGORIES:
        if round(aqi) <= upper:
            return name
    return CATEGORIES[-1][1]


def category_index(aqi) -> np.ndarray:
    """0 (Good) ... 5 (Severe); -1 where the AQI is missing."""
    values = np.asarray(aqi, dtype=float)
    idx = np.searchsorted([upper for upper, _, _ in CATEGORIES], np.round(values), side="left")
    return np.where(np.isnan(values), -1, np.minimum(idx, len(CATEGORIES) - 1))


def advisory(aqi: float) -> str | None:
    name = category(aqi)
    return next((text for _, n, text in CATEGORIES if n == name), None)


def averaged_concentrations(df: pd.DataFrame) -> pd.DataFrame:
    """CPCB averaging windows on a regular hourly grid."""
    out = pd.DataFrame(index=df.index)
    for p in DAILY_MEAN:
        if p in df:
            out[p] = df[p].rolling(24, min_periods=16).mean()
    for p in EIGHT_HOUR:
        if p in df:
            out[p] = df[p].rolling(8, min_periods=6).mean().rolling(24, min_periods=1).max()
    return out


def compute_aqi(df: pd.DataFrame) -> pd.DataFrame:
    """Sub-indices, AQI, category and prominent pollutant for every hour."""
    avg = averaged_concentrations(df)
    si = pd.DataFrame({f"si_{p}": sub_index(avg[p], p) for p in avg}, index=df.index)
    available = si.notna().sum(axis=1)
    has_pm = si[[c for c in ("si_pm25", "si_pm10") if c in si]].notna().any(axis=1)
    valid = (available >= 3) & has_pm

    out = si.copy()
    out["aqi"] = si.max(axis=1).where(valid).round(0)
    prominent = si.fillna(-1).idxmax(axis=1).str.removeprefix("si_")
    out["prominent_pollutant"] = prominent.where(valid)
    out["aqi_category"] = [category(v) for v in out["aqi"]]
    return out
