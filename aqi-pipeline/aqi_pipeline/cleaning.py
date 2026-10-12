"""Merge raw batches into one history and repair what can be repaired.

Every change is counted, so the data quality report records what cleaning did (lineage).
Gaps longer than `max_interpolate_hours` are left missing: inventing hours of pollution data
would make the model look better than it is.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .quality import flatline_mask, spike_mask
from .standardize import COLUMNS, POLLUTANTS


def merge_batches(batches: list[pd.DataFrame]) -> pd.DataFrame:
    """Batches in fetch order; for each hour and column the newest non-missing value wins."""
    stacked = pd.concat(batches)
    return stacked.groupby(level=0, sort=True).last()


def _short_gaps(s: pd.Series, max_len: int) -> pd.Series:
    isna = s.isna()
    run_id = (isna != isna.shift()).cumsum()
    run_len = isna.groupby(run_id).transform("size")
    return isna & (run_len <= max_len)


def _fill_short_gaps(s: pd.Series, max_len: int) -> tuple[pd.Series, int]:
    fillable = _short_gaps(s, max_len)
    filled = s.where(~fillable, s.interpolate(method="time", limit_area="inside"))
    return filled, int((fillable & filled.notna()).sum())


def clean(history: pd.DataFrame, q: dict[str, Any], as_of: pd.Timestamp, start: pd.Timestamp,
          end: pd.Timestamp) -> tuple[pd.DataFrame, dict[str, Any]]:
    grid = pd.date_range(start, end, freq="h", name="time")
    df = history.reindex(grid)[COLUMNS].copy()
    df.loc[df.index > as_of, POLLUTANTS] = np.nan
    stats: dict[str, Any] = {"rows": len(df)}

    out_of_range = {}
    for col, (lo, hi) in q["ranges"].items():
        bad = df[col].notna() & ~df[col].between(lo, hi)
        out_of_range[col] = int(bad.sum())
        df.loc[bad, col] = np.nan
    stats["out_of_range_removed"] = out_of_range

    swapped = df["pm25"] > df["pm10"]
    df.loc[swapped, ["pm25", "pm10"]] = np.nan
    stats["pm_inconsistent_removed"] = int(swapped.sum())

    stuck, spikes = {}, {}
    for col in POLLUTANTS:
        mask = flatline_mask(df[col], q["flatline_hours"])
        stuck[col] = int(mask.sum())
        df.loc[mask, col] = np.nan
        mask = spike_mask(df[col], q["spike_threshold"], q["spike_neighbour_ratio"])
        spikes[col] = int(mask.sum())
        df.loc[mask, col] = np.nan
    stats["flatline_removed"] = stuck
    stats["spikes_removed"] = spikes

    imputed = {}
    for col in COLUMNS:
        if col == "wind_dir_deg":
            continue
        df[col], imputed[col] = _fill_short_gaps(df[col], q["max_interpolate_hours"])
    # Wind direction is circular (350° and 10° are close), so interpolate its components.
    rad = np.deg2rad(df["wind_dir_deg"])
    sin, imputed["wind_dir_deg"] = _fill_short_gaps(np.sin(rad), q["max_interpolate_hours"])
    cos, _ = _fill_short_gaps(np.cos(rad), q["max_interpolate_hours"])
    df["wind_dir_deg"] = np.rad2deg(np.arctan2(sin, cos)) % 360
    stats["short_gaps_interpolated"] = imputed
    # PM2.5 and PM10 are interpolated separately, which can break PM2.5 <= PM10 again.
    swapped = df["pm25"] > df["pm10"]
    df.loc[swapped, ["pm25", "pm10"]] = np.nan
    stats["pm_inconsistent_after_interpolation"] = int(swapped.sum())
    stats["still_missing_observed"] = {c: int(df.loc[df.index <= as_of, c].isna().sum()) for c in POLLUTANTS}
    return df, stats
