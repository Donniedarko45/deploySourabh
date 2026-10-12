"""Feature engineering.

Features at hour t use only data up to t, plus the weather *forecast* for t..t+h. In
training, the forecast is stood in for by the weather that actually happened (a perfect
forecast), so live errors will be somewhat higher than the test errors.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .aqi import DAILY_MEAN, sub_index
from .standardize import POLLUTANTS

AQI_LAGS = [1, 2, 3, 6, 12, 24, 48, 168]
TARGET_WEATHER = ["temp_c", "rh_pct", "wind_ms", "wind_u", "wind_v", "precip_mm", "pressure_hpa"]
DRIFT_FEATURES = ["aqi", "pm25", "pm10", "no2", "o3", "temp_c", "rh_pct", "wind_ms"]


def _cyclic(values, period: float, prefix: str, out: pd.DataFrame) -> None:
    angle = 2 * np.pi * np.asarray(values, dtype=float) / period
    out[f"{prefix}_sin"] = np.sin(angle)
    out[f"{prefix}_cos"] = np.cos(angle)


def weather_frame(silver: pd.DataFrame) -> pd.DataFrame:
    wx = silver[["temp_c", "rh_pct", "wind_ms", "precip_mm", "pressure_hpa"]].copy()
    rad = np.deg2rad(silver["wind_dir_deg"])
    # Direction the wind blows *from* -> eastward (u) and northward (v) components.
    wx["wind_u"] = -silver["wind_ms"] * np.sin(rad)
    wx["wind_v"] = -silver["wind_ms"] * np.cos(rad)
    return wx


def base_features(silver: pd.DataFrame, timezone: str) -> pd.DataFrame:
    """Features known at hour t. Includes the weather columns (forecast rows too)."""
    aqi = silver["aqi"]
    f = pd.DataFrame(index=silver.index)
    f["aqi"] = aqi
    for lag in AQI_LAGS:
        f[f"aqi_lag_{lag}h"] = aqi.shift(lag)
    for window in (6, 24, 72):
        f[f"aqi_mean_{window}h"] = aqi.rolling(window, min_periods=window // 2).mean()
    f["aqi_std_24h"] = aqi.rolling(24, min_periods=12).std()
    f["aqi_change_1h"] = aqi.diff(1)
    f["aqi_change_24h"] = aqi.diff(24)

    for p in POLLUTANTS:
        f[p] = silver[p]
        f[f"{p}_mean_24h"] = silver[p].rolling(24, min_periods=12).mean()
    f["pm25_change_3h"] = silver["pm25"].diff(3)
    f["pm_ratio"] = silver["pm25"] / silver["pm10"]

    wx = weather_frame(silver)
    for col in wx:
        f[col] = wx[col]
    f["wind_mean_24h"] = wx["wind_ms"].rolling(24, min_periods=12).mean()
    f["precip_sum_24h"] = wx["precip_mm"].rolling(24, min_periods=12).sum()
    f["rh_mean_24h"] = wx["rh_pct"].rolling(24, min_periods=12).mean()

    local = silver.index.tz_convert(timezone)
    _cyclic(local.hour + local.minute / 60, 24, "hour", f)
    _cyclic(local.dayofyear, 365.25, "doy", f)
    f["day_of_week"] = local.dayofweek
    f["is_weekend"] = (local.dayofweek >= 5).astype(int)
    return f


def horizon_frame(base: pd.DataFrame, horizon: int, timezone: str) -> pd.DataFrame:
    """Base features plus the weather forecast for the target hour t + horizon."""
    X = base.copy()
    # The AQI uses 24 h averages, so the target's averaging window already contains the
    # last 24 - h observed hours. Their mean is known now.
    if horizon < 24:
        for p in DAILY_MEAN:
            known = base[p].rolling(24 - horizon, min_periods=max(1, (24 - horizon) // 2)).mean()
            X[f"{p}_known_part_mean"] = known
            X[f"si_{p}_known_part"] = sub_index(known, p)
    for col in TARGET_WEATHER:
        X[f"{col}_at_target"] = base[col].shift(-horizon)
    X["wind_mean_to_target"] = base["wind_ms"].rolling(horizon, min_periods=1).mean().shift(-horizon)
    X["precip_sum_to_target"] = base["precip_mm"].rolling(horizon, min_periods=1).sum().shift(-horizon)
    target_local = (base.index + pd.Timedelta(hours=horizon)).tz_convert(timezone)
    _cyclic(target_local.hour + target_local.minute / 60, 24, "target_hour", X)
    return X


def target(base: pd.DataFrame, horizon: int) -> pd.Series:
    return base["aqi"].shift(-horizon)
