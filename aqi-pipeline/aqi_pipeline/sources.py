"""Ingestion sources.

Every source returns a RawBatch in the same raw schema: a "time" column (UTC) plus the
Open-Meteo variable names, together with the units the source declared. Standardisation to
the pipeline's canonical names and units happens later, in standardize.py.

* open_meteo: live hourly pollutant data (CAMS, via the Open-Meteo Air Quality API) and
  weather (ERA5 archive for history, forecast API for recent hours and the forecast).
  No API key is needed.
* synthetic: a deterministic, city-specific generator with realistic seasonality, weather
  coupling and injected sensor faults. It is for offline demos and tests only.
"""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd
from scipy.signal import lfilter

log = logging.getLogger(__name__)

AQ_VARS = ["pm2_5", "pm10", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"]
WX_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_direction_10m",
    "precipitation",
    "surface_pressure",
]
RAW_COLUMNS = ["time", *AQ_VARS, *WX_VARS]

AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_LAG_DAYS = 6  # ERA5 reaches the archive with a delay of about five days


class SourceError(RuntimeError):
    pass


@dataclass
class RawBatch:
    frame: pd.DataFrame
    units: dict[str, str]
    source: str
    request: dict[str, Any] = field(default_factory=dict)


def fetch(cfg: dict[str, Any], city: dict[str, Any], start: pd.Timestamp, as_of: pd.Timestamp,
          end: pd.Timestamp) -> RawBatch:
    """Fetch hourly data for [start, end]. Pollutants are observations up to as_of; weather
    after as_of is the forecast the model will use."""
    if cfg["source"] == "open_meteo":
        batch = fetch_open_meteo(city, start, as_of, end)
    else:
        syn = cfg.get("synthetic", {})
        batch = fetch_synthetic(city, start, as_of, end, seed=int(syn.get("seed", 7)),
                                fault_rate=float(syn.get("fault_rate", 1.0)))
    frame = batch.frame
    times = pd.to_datetime(frame["time"], utc=True, errors="coerce")
    frame = frame[(times >= start) & (times <= end)].copy()
    # Never let a pollutant value from after the run time into the pipeline.
    future = pd.to_datetime(frame["time"], utc=True, errors="coerce") > as_of
    frame.loc[future, [c for c in AQ_VARS if c in frame]] = np.nan
    batch.frame = frame.reset_index(drop=True)
    return batch


# --------------------------------------------------------------------------- Open-Meteo


def _get_json(url: str, params: dict[str, Any], retries: int = 4) -> dict[str, Any]:
    full_url = f"{url}?{urllib.parse.urlencode(params)}"
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(full_url, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")[:300]
            if exc.code < 500 and exc.code != 429:
                raise SourceError(f"{url} rejected the request ({exc.code}): {body}") from exc
            error: Exception = exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            error = exc
        if attempt == retries - 1:
            raise SourceError(f"{url} failed after {retries} attempts: {error}") from error
        wait = 2 ** (attempt + 1)
        log.warning("request to %s failed (%s); retrying in %ss", url, error, wait)
        time.sleep(wait)
    raise AssertionError("unreachable")


def _date_chunks(first: date, last: date, days: int):
    while first <= last:
        chunk_end = min(last, first + timedelta(days=days - 1))
        yield first, chunk_end
        first = chunk_end + timedelta(days=1)


def _hourly(url: str, params: dict[str, Any], variables: list[str], first: date, last: date,
            chunk_days: int, units: dict[str, str]) -> pd.DataFrame:
    frames = []
    for d0, d1 in _date_chunks(first, last, chunk_days):
        payload = _get_json(url, {**params, "hourly": ",".join(variables),
                                  "start_date": d0.isoformat(), "end_date": d1.isoformat()})
        if "hourly" not in payload:
            raise SourceError(f"{url} returned no hourly data: {str(payload)[:200]}")
        frames.append(pd.DataFrame(payload["hourly"]))
        for var, unit in payload.get("hourly_units", {}).items():
            if var == "time":
                continue
            if units.setdefault(var, unit) != unit:
                raise SourceError(f"{var} arrived in {unit} but earlier data used {units[var]}")
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["time"])


def fetch_open_meteo(city: dict[str, Any], start: pd.Timestamp, as_of: pd.Timestamp,
                     end: pd.Timestamp) -> RawBatch:
    common = {"latitude": city["latitude"], "longitude": city["longitude"], "timezone": "GMT"}
    units: dict[str, str] = {}
    aq = _hourly(AQ_URL, common, AQ_VARS, start.date(), as_of.date(), 90, units)

    archive_last = min(end.date(), (pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=ARCHIVE_LAG_DAYS)).date())
    parts = []
    if start.date() <= archive_last:
        parts.append(_hourly(ARCHIVE_URL, common, WX_VARS, start.date(), archive_last, 366, units))
    if end.date() > archive_last:
        recent_first = max(start.date(), archive_last + timedelta(days=1))
        parts.append(_hourly(FORECAST_URL, common, WX_VARS, recent_first, end.date(), 30, units))
    wx = pd.concat(parts, ignore_index=True)

    frame = aq.merge(wx, on="time", how="outer")
    frame = frame[[c for c in RAW_COLUMNS if c in frame]]
    request = {"aq_url": AQ_URL, "weather_urls": [ARCHIVE_URL, FORECAST_URL], **common,
               "start": str(start), "as_of": str(as_of), "end": str(end)}
    return RawBatch(frame, units, "open_meteo", request)


# --------------------------------------------------------------------------- synthetic

SYNTHETIC_START = pd.Timestamp("2023-01-01", tz="UTC")
DIWALI = ["2023-11-12", "2024-11-01", "2025-10-20", "2026-11-08", "2027-10-29", "2028-10-17"]
OPEN_METEO_UNITS = {
    "pm2_5": "μg/m³", "pm10": "μg/m³", "carbon_monoxide": "μg/m³", "nitrogen_dioxide": "μg/m³",
    "sulphur_dioxide": "μg/m³", "ozone": "μg/m³", "temperature_2m": "°C", "relative_humidity_2m": "%",
    "wind_speed_10m": "km/h", "wind_direction_10m": "°", "precipitation": "mm", "surface_pressure": "hPa",
}


def _rng(*keys: Any) -> np.random.Generator:
    return np.random.default_rng([zlib.crc32(str(k).encode()) for k in keys])


def _ar1(rng: np.random.Generator, n: int, phi: float, sigma: float) -> np.ndarray:
    """AR(1) noise. Each series has its own generator, so a value at a given hour does not
    depend on how far the series was generated."""
    eps = rng.normal(0.0, sigma, n)
    eps[0] /= np.sqrt(1 - phi**2)
    return lfilter([1.0], [1.0, -phi], eps)


def _bump(x: np.ndarray, centre: float, width: float) -> np.ndarray:
    return np.exp(-(((x - centre) / width) ** 2))


def synthetic_series(city: dict[str, Any], end: pd.Timestamp, seed: int) -> pd.DataFrame:
    """Clean hourly series from SYNTHETIC_START to end, in Open-Meteo units."""
    idx = pd.date_range(SYNTHETIC_START, end, freq="h")
    n = len(idx)
    rng = lambda name: _rng(seed, city["name"], name)  # noqa: E731
    local = idx.tz_convert(city["timezone"])
    hour = np.asarray(local.hour + local.minute / 60, dtype=float)
    doy = np.asarray(local.dayofyear, dtype=float)
    lat = float(city["latitude"])

    winter = np.cos(2 * np.pi * (doy - 15) / 365.25)  # +1 mid-January, -1 mid-July
    monsoon = _bump(doy, 215, 35)
    premonsoon = _bump(doy, 140, 30)
    day_cycle = np.cos(2 * np.pi * (hour - 15) / 24)  # +1 mid-afternoon

    temp = 25 - 8.5 * winter + 4 * premonsoon + 5 * day_cycle + _ar1(rng("temp"), n, 0.95, 0.6)
    rh = np.clip(55 + 12 * winter + 30 * monsoon - 15 * premonsoon - 12 * day_cycle
                 + _ar1(rng("rh"), n, 0.9, 3.0), 5, 100)
    wind = np.exp(np.log(2.2) + 0.25 * premonsoon + 0.15 * monsoon - 0.2 * winter
                  + 0.35 * np.cos(2 * np.pi * (hour - 14) / 24) + _ar1(rng("wind"), n, 0.9, 0.18))
    wind_dir = (300 - 170 * _bump(doy, 205, 50) + _ar1(rng("dir"), n, 0.97, 6.0)) % 360
    rain_chance = 0.01 + 0.18 * monsoon
    rain = np.where(rng("rain").random(n) < rain_chance, rng("rain_mm").gamma(0.8, 4.0, n), 0.0)
    pressure = 1000 - 0.11 * (lat - 20) + 9 * winter + 1.5 * np.cos(2 * np.pi * (hour - 10) / 12) \
        + _ar1(rng("pressure"), n, 0.98, 0.3)

    # Pollution builds up under calm, cold nights and clears with wind and rain.
    north = np.clip((lat - 10) / 20, 0, 1)
    rain_6h = pd.Series(rain).rolling(6, min_periods=1).sum().to_numpy()
    nw_wind = np.clip(np.cos(np.deg2rad(wind_dir - 315)), 0, None)
    stubble = _bump(doy, 310, 12) * nw_wind * north
    festival = np.zeros(n)
    for day in DIWALI:
        night = pd.Timestamp(day + " 22:00", tz=city["timezone"]).tz_convert("UTC")
        hours_from_night = np.asarray((idx - night) / pd.Timedelta(hours=1), dtype=float)
        festival += 1.1 * _bump(hours_from_night, 0, 6)
    log_pm25 = (np.log(30 + 50 * north) + (0.4 + 0.5 * north) * winter - 0.25 * monsoon
                + 0.35 * np.cos(2 * np.pi * (hour - 1) / 24)
                - 0.45 * np.log(wind / 2.2) - 0.12 * np.minimum(rain_6h, 10)
                + 1.2 * stubble + festival + _ar1(rng("pm25"), n, 0.97, 0.07))
    pm25 = np.exp(log_pm25)
    dust = rng("dust").random(n) < 0.002 * premonsoon
    dust_boost = pd.Series(np.where(dust, rng("dust_mm").uniform(150, 400, n), 0.0)).rolling(8, min_periods=1).max()
    pm10 = pm25 * (1.7 + 0.8 * premonsoon) * np.exp(_ar1(rng("pm10"), n, 0.9, 0.05)) + dust_boost.to_numpy()
    traffic = _bump(hour, 9, 2) + _bump(hour, 20, 2.5)
    no2 = (22 + 18 * north + 12 * winter + 20 * traffic) * (wind / 2.2) ** -0.4 \
        * np.exp(_ar1(rng("no2"), n, 0.9, 0.08))
    co = (300 + 6 * pm25 + 12 * no2) * np.exp(_ar1(rng("co"), n, 0.9, 0.08))
    so2 = np.clip(10 + 5 * winter + 4 * north + _ar1(rng("so2"), n, 0.9, 1.0), 1, None)
    daylight = np.clip(np.sin(np.pi * (hour - 7) / 12), 0, None)
    o3 = (18 + 70 * daylight * (1 + 0.6 * premonsoon - 0.5 * monsoon - 0.3 * winter)) \
        * np.exp(_ar1(rng("o3"), n, 0.9, 0.08))

    return pd.DataFrame({
        "time": idx,
        "pm2_5": pm25.round(1), "pm10": pm10.round(1), "carbon_monoxide": co.round(1),
        "nitrogen_dioxide": no2.round(1), "sulphur_dioxide": so2.round(1), "ozone": o3.round(1),
        "temperature_2m": temp.round(1), "relative_humidity_2m": rh.round(0),
        "wind_speed_10m": (wind * 3.6).round(1), "wind_direction_10m": wind_dir.round(0),
        "precipitation": rain.round(1), "surface_pressure": pressure.round(1),
    })


def _inject_faults(frame: pd.DataFrame, rng: np.random.Generator, rate: float) -> pd.DataFrame:
    """Reproduce the faults real station feeds have, so the quality layer has work to do."""
    df = frame.copy()
    observed = np.flatnonzero(df["pm2_5"].notna().to_numpy())
    if rate <= 0 or len(observed) < 48:
        return df
    n = len(observed)
    cols = [df.columns.get_loc(c) for c in AQ_VARS]

    def pick(fraction: float) -> np.ndarray:
        return rng.choice(observed, size=int(n * fraction * rate), replace=False)

    for _ in range(rng.poisson(n * 0.0025 * rate)):  # station outages (every pollutant)
        start = rng.choice(observed)
        df.iloc[start:start + int(rng.integers(1, 30)), cols] = np.nan
    for col in cols:  # isolated dropped readings
        df.iloc[pick(0.01), col] = np.nan
    for row in pick(0.002):  # error sentinels
        df.iloc[row, rng.choice(cols)] = -999.0
    for row in pick(0.002):  # single-hour electrical spikes
        col = rng.choice(cols)
        df.iloc[row, col] = df.iloc[row, col] * rng.uniform(5, 15)
    pm25, pm10 = df.columns.get_loc("pm2_5"), df.columns.get_loc("pm10")
    for row in pick(0.003):  # PM channels swapped
        df.iloc[row, [pm25, pm10]] = df.iloc[row, [pm10, pm25]].to_numpy()
    for _ in range(rng.poisson(n / 1500 * rate)):  # stuck sensor
        start = rng.choice(observed)
        stop = min(start + int(rng.integers(10, 24)), len(df))
        df.iloc[start:stop, pm25] = df.iloc[start, pm25]
    dupes = df.iloc[pick(0.005)].copy()  # re-sent records, slightly different values
    dupes[AQ_VARS] = dupes[AQ_VARS] * rng.uniform(0.97, 1.03, size=(len(dupes), 1))
    return pd.concat([df, dupes], ignore_index=True)


def fetch_synthetic(city: dict[str, Any], start: pd.Timestamp, as_of: pd.Timestamp, end: pd.Timestamp,
                    seed: int = 7, fault_rate: float = 1.0) -> RawBatch:
    if start < SYNTHETIC_START:
        raise SourceError(f"synthetic data starts at {SYNTHETIC_START.date()}; reduce history_days")
    frame = synthetic_series(city, end, seed)
    frame = frame[frame["time"] >= start].reset_index(drop=True)
    future = frame["time"] > as_of
    frame.loc[future, AQ_VARS] = np.nan

    # Weather after as_of is a forecast: add error that grows with lead time.
    lead = ((frame.loc[future, "time"] - as_of) / pd.Timedelta(hours=1)).to_numpy()
    fc = _rng(seed, city["name"], "forecast", as_of.value)
    frame.loc[future, "temperature_2m"] += fc.normal(0, 0.3 + 0.04 * lead)
    frame.loc[future, "relative_humidity_2m"] = np.clip(
        frame.loc[future, "relative_humidity_2m"] + fc.normal(0, 2 + 0.15 * lead), 0, 100)
    frame.loc[future, "wind_speed_10m"] *= np.exp(fc.normal(0, 0.08 + 0.01 * lead))

    frame = _inject_faults(frame, _rng(seed, city["name"], "faults", start.value), fault_rate)
    frame["time"] = frame["time"].dt.strftime("%Y-%m-%dT%H:%M")  # same wire format as Open-Meteo
    request = {"generator": "synthetic", "seed": seed, "fault_rate": fault_rate,
               "start": str(start), "as_of": str(as_of), "end": str(end)}
    return RawBatch(frame, dict(OPEN_METEO_UNITS), "synthetic", request)
