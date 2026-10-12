"""Produce the forecast, keep a log of every prediction, and raise alerts."""

from __future__ import annotations

import json
import logging
import os
import urllib.request
from pathlib import Path
from typing import Any

import pandas as pd

from . import features
from .aqi import advisory, category
from .modeling import Champion

log = logging.getLogger(__name__)


def make_forecast(base: pd.DataFrame, silver: pd.DataFrame, champion: Champion | None, cfg: dict[str, Any],
                  city: dict[str, Any], as_of: pd.Timestamp, quality_score: float | None) -> dict[str, Any]:
    """Forecast every horizon. Horizons without a model that beat persistence (or every
    horizon, before the first model is promoted) use persistence and say so."""
    tz = city["timezone"]
    observed = base.loc[base.index <= as_of, "aqi"]
    issued_from = observed.last_valid_index()
    if issued_from is None:
        raise ValueError("no observed AQI to forecast from")
    current = silver.loc[issued_from]
    result: dict[str, Any] = {
        "city": city["name"],
        "issued_at": as_of.isoformat(),
        "based_on_hour": issued_from.isoformat(),
        "observation_age_h": int((as_of - issued_from) / pd.Timedelta(hours=1)),
        "model_version": champion.version if champion else None,
        "data_quality_score": quality_score,
        "current": {"aqi": float(current["aqi"]), "category": current["aqi_category"],
                    "prominent_pollutant": current["prominent_pollutant"]},
        "forecasts": [],
    }
    for h in cfg["horizons_hours"]:
        evaluation = champion.metadata["horizons"].get(str(h), {}) if champion else {}
        if champion and champion.uses_model(h):
            X = features.horizon_frame(base, h, tz).loc[[issued_from]]
            X = X[champion.metadata["features_by_horizon"][str(h)]]
            value = round(float(champion.model(h).predict(X)[0]))
            method, expected_error = "model", evaluation["mae"]
        else:
            value = round(float(current["aqi"]))
            method, expected_error = "persistence", evaluation.get("persistence_mae")
        valid_at = issued_from + pd.Timedelta(hours=h)
        result["forecasts"].append({
            "horizon_h": h,
            "valid_at_utc": valid_at.isoformat(),
            "valid_at_local": valid_at.tz_convert(tz).strftime("%Y-%m-%d %H:%M %Z"),
            "aqi": value,
            "category": category(value),
            "health_advisory": advisory(value),
            "method": method,
            "expected_abs_error": expected_error,
        })
    return result


def append_log(log_path: Path, forecast: dict[str, Any]) -> None:
    rows = pd.DataFrame([{
        "issued_at": forecast["issued_at"], "based_on_hour": forecast["based_on_hour"],
        "horizon_h": f["horizon_h"], "target_time": f["valid_at_utc"],
        "predicted_aqi": f["aqi"], "method": f["method"], "model_version": forecast["model_version"],
    } for f in forecast["forecasts"]])
    if log_path.exists():
        rows = pd.concat([pd.read_csv(log_path), rows], ignore_index=True)
    rows = rows.drop_duplicates(["issued_at", "horizon_h"], keep="last").sort_values(["issued_at", "horizon_h"])
    rows.to_csv(log_path, index=False)


def alert(forecast: dict[str, Any], cfg: dict[str, Any]) -> list[str]:
    threshold = cfg["alerts"]["aqi_threshold"]
    messages = [f"{forecast['city']}: AQI forecast {f['aqi']} ({f['category']}) at {f['valid_at_local']}. "
                f"{f['health_advisory']}" for f in forecast["forecasts"] if f["aqi"] >= threshold]
    if not messages:
        return []
    for message in messages:
        log.warning("ALERT %s", message)
    url = os.environ.get(cfg["alerts"]["webhook_env"])
    if url:  # e.g. a Slack or Teams incoming webhook
        body = json.dumps({"text": "\n".join(messages)}).encode()
        request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(request, timeout=10).close()
        except OSError as exc:
            log.error("alert webhook failed: %s", exc)
    return messages
