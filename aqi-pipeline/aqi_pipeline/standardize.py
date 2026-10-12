"""Standardisation: one schema, one set of units and UTC time, whatever the source.

Units are converted from the units the source *declared*, never assumed. An unknown unit
stops the run instead of silently producing numbers off by a factor of 1000.
"""

from __future__ import annotations

import pandas as pd

# raw name -> (canonical name, canonical unit). CO uses mg/m³ because the CPCB AQI does.
CANONICAL = {
    "pm2_5": ("pm25", "µg/m³"),
    "pm10": ("pm10", "µg/m³"),
    "nitrogen_dioxide": ("no2", "µg/m³"),
    "sulphur_dioxide": ("so2", "µg/m³"),
    "carbon_monoxide": ("co", "mg/m³"),
    "ozone": ("o3", "µg/m³"),
    "temperature_2m": ("temp_c", "°C"),
    "relative_humidity_2m": ("rh_pct", "%"),
    "wind_speed_10m": ("wind_ms", "m/s"),
    "wind_direction_10m": ("wind_dir_deg", "°"),
    "precipitation": ("precip_mm", "mm"),
    "surface_pressure": ("pressure_hpa", "hPa"),
}
POLLUTANTS = ["pm25", "pm10", "no2", "so2", "co", "o3"]
WEATHER = ["temp_c", "rh_pct", "wind_ms", "wind_dir_deg", "precip_mm", "pressure_hpa"]
COLUMNS = POLLUTANTS + WEATHER

# (source unit, canonical unit) -> multiplier
CONVERSIONS = {
    ("µg/m³", "µg/m³"): 1.0,
    ("mg/m³", "µg/m³"): 1000.0,
    ("µg/m³", "mg/m³"): 0.001,
    ("mg/m³", "mg/m³"): 1.0,
    ("°C", "°C"): 1.0,
    ("%", "%"): 1.0,
    ("m/s", "m/s"): 1.0,
    ("km/h", "m/s"): 1 / 3.6,
    ("mph", "m/s"): 0.44704,
    ("kn", "m/s"): 0.514444,
    ("°", "°"): 1.0,
    ("mm", "mm"): 1.0,
    ("inch", "mm"): 25.4,
    ("hPa", "hPa"): 1.0,
}


class UnitError(ValueError):
    pass


def normalise_unit(unit: str) -> str:
    # Greek mu (U+03BC) and the micro sign (U+00B5) look identical; sources use both.
    return unit.strip().replace("μ", "µ").replace("ug/m3", "µg/m³").replace("mg/m3", "mg/m³")


def conversion_factor(raw: str, unit: str | None) -> float:
    target = CANONICAL[raw][1]
    key = (normalise_unit(unit or ""), target)
    if key not in CONVERSIONS:
        raise UnitError(f"no conversion from {unit!r} to {target} for {raw}")
    return CONVERSIONS[key]


def standardize(frame: pd.DataFrame, units: dict[str, str]) -> pd.DataFrame:
    """Rename to canonical columns, convert units, parse time as UTC. Index = time."""
    out = pd.DataFrame(index=pd.DatetimeIndex(pd.to_datetime(frame["time"], utc=True), name="time"))
    for raw, (name, _) in CANONICAL.items():
        values = pd.to_numeric(frame[raw], errors="coerce").to_numpy() if raw in frame else float("nan")
        factor = conversion_factor(raw, units.get(raw)) if raw in frame else 1.0
        out[name] = values * factor
    return out
