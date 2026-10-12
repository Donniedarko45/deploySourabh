"""Monitoring: is the champion model still trustworthy, and should we retrain?

* Live accuracy: earlier forecasts are scored against the AQI that was later observed, and
  against persistence on exactly the same forecasts. Absolute errors grow with the AQI level
  (winter errors are several times monsoon errors), so "live MAE vs test MAE" would raise
  alarms every winter. Skill over persistence does not depend on the level.
* Drift: the Population Stability Index (PSI) of key inputs over the last week, compared
  with the same weeks one year earlier (part of the training data). It is reported to help
  explain a degradation but does not trigger retraining by itself: a week of strongly
  autocorrelated data is a noisy sample, and acting on it would retrain constantly.
* Age: models are retrained on a fixed schedule even when nothing looks wrong.

Retraining is triggered by: no champion, the champion's age, or live skill below the minimum.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .features import DRIFT_FEATURES
from .modeling import Champion


def psi(reference: pd.Series, recent: pd.Series, bins: int = 10) -> float | None:
    reference, recent = reference.dropna(), recent.dropna()
    if len(reference) < 100 or len(recent) < 24:
        return None
    inner_edges = np.unique(np.quantile(reference, np.linspace(0, 1, bins + 1)))[1:-1]
    edges = np.r_[-np.inf, inner_edges, np.inf]
    expected = np.histogram(reference, bins=edges)[0] / len(reference)
    actual = np.histogram(recent, bins=edges)[0] / len(recent)
    expected, actual = np.clip(expected, 1e-4, None), np.clip(actual, 1e-4, None)
    return round(float(np.sum((actual - expected) * np.log(actual / expected))), 4)


def seasonal_drift(base: pd.DataFrame, as_of: pd.Timestamp, recent_days: int,
                   reference_days: int) -> dict[str, float | None]:
    recent = base[(base.index <= as_of) & (base.index > as_of - pd.Timedelta(days=recent_days))]
    year_ago = as_of - pd.Timedelta(days=365)
    half = pd.Timedelta(days=reference_days / 2)
    reference = base[(base.index > year_ago - half) & (base.index <= year_ago + half)]
    return {col: psi(reference[col], recent[col]) for col in DRIFT_FEATURES}


def live_accuracy(log_path: Path, aqi: pd.Series, as_of: pd.Timestamp, days: int) -> dict[str, Any]:
    """Score logged forecasts whose target hour has now been observed."""
    if not log_path.exists():
        return {}
    preds = pd.read_csv(log_path)
    for col in ("target_time", "based_on_hour"):
        preds[col] = pd.to_datetime(preds[col], utc=True)
    preds = preds[(preds["target_time"] <= as_of) & (preds["target_time"] > as_of - pd.Timedelta(days=days))]
    preds["actual_aqi"] = aqi.reindex(preds["target_time"]).to_numpy()
    preds["persistence_aqi"] = aqi.reindex(preds["based_on_hour"]).to_numpy()
    preds = preds.dropna(subset=["actual_aqi", "persistence_aqi"])
    result = {}
    for h, group in preds.groupby("horizon_h"):
        error = group["predicted_aqi"] - group["actual_aqi"]
        mae = float(error.abs().mean())
        persistence_mae = float((group["persistence_aqi"] - group["actual_aqi"]).abs().mean())
        result[str(int(h))] = {
            "samples": int(len(group)), "mae": round(mae, 2), "bias": round(float(error.mean()), 2),
            "persistence_mae": round(persistence_mae, 2),
            "skill_vs_persistence": round(1 - mae / persistence_mae, 3) if persistence_mae > 0 else 0.0,
        }
    return result


def monitor(base: pd.DataFrame, champion: Champion | None, cfg: dict[str, Any], as_of: pd.Timestamp,
            log_path: Path) -> dict[str, Any]:
    mon = cfg["monitoring"]
    report: dict[str, Any] = {"as_of": as_of.isoformat(), "champion": champion.version if champion else None}
    reasons = []
    if champion is None:
        reasons.append("no champion model yet")
    else:
        trained = pd.Timestamp(champion.metadata["as_of"])
        age_days = (as_of - trained) / pd.Timedelta(days=1)
        report["model_age_days"] = round(age_days, 2)
        if age_days >= cfg["model"]["retrain_every_days"]:
            reasons.append(f"model is {age_days:.1f} days old")

        drift = seasonal_drift(base, as_of, mon["drift_window_days"], mon["reference_days"])
        report["drift_psi_vs_last_year"] = drift
        report["drifted_features"] = [c for c, v in drift.items() if v is not None and v > mon["psi_threshold"]]

        live = live_accuracy(log_path, base["aqi"], as_of, mon["live_window_days"])
        report["live_accuracy"] = live
        for h, stats in live.items():
            if champion.uses_model(int(h)) and stats["samples"] >= mon["min_live_samples"] \
                    and stats["skill_vs_persistence"] < mon["min_live_skill"]:
                reasons.append(f"{h} h model is losing to persistence live (MAE {stats['mae']} vs "
                               f"{stats['persistence_mae']} over {stats['samples']} forecasts)")
    report["retrain"] = bool(reasons)
    report["reasons"] = reasons
    return report
