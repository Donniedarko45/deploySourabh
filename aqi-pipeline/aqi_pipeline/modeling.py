"""Training, evaluation and a small file-based model registry.

One gradient-boosted model per forecast horizon. Each horizon may predict either the AQI
level or its change from now (change suits short horizons, level suits long ones); the
choice is made on a validation slice of the training data, never on the test data.

Every model is compared with the persistence baseline ("AQI in h hours = AQI now") on the most
recent 20% of the data, which it never saw. A horizon uses the model only if it beats that
baseline clearly; otherwise the forecast for that horizon falls back to persistence and is
labelled as such.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from . import features
from .aqi import category_index

log = logging.getLogger(__name__)
TARGET_KINDS = ("change", "level")


@dataclass
class AqiModel:
    estimator: HistGradientBoostingRegressor
    target_kind: str  # "change" (AQI(t+h) - AQI(t)) or "level" (AQI(t+h))

    @classmethod
    def fit(cls, cfg: dict[str, Any], X: pd.DataFrame, y: pd.Series, target_kind: str) -> "AqiModel":
        m = cfg["model"]
        estimator = HistGradientBoostingRegressor(
            max_iter=m["max_iter"], learning_rate=m["learning_rate"], max_leaf_nodes=m["max_leaf_nodes"],
            l2_regularization=1.0, early_stopping=False, random_state=42)
        estimator.fit(X, y - X["aqi"] if target_kind == "change" else y)
        return cls(estimator, target_kind)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        raw = self.estimator.predict(X)
        return np.clip(raw + X["aqi"].to_numpy() if self.target_kind == "change" else raw, 0, 500)


@dataclass
class Champion:
    version: str
    path: Path
    metadata: dict[str, Any]

    def uses_model(self, horizon: int) -> bool:
        return bool(self.metadata["horizons"].get(str(horizon), {}).get("accepted"))

    def model(self, horizon: int) -> AqiModel:
        return joblib.load(self.path / f"model_h{horizon}.joblib")


def _metrics(y: np.ndarray, pred: np.ndarray, persistence: np.ndarray) -> dict[str, float]:
    mae = mean_absolute_error(y, pred)
    base = mean_absolute_error(y, persistence)
    return {
        "mae": round(mae, 2),
        "rmse": round(float(np.sqrt(mean_squared_error(y, pred))), 2),
        "r2": round(r2_score(y, pred), 3),
        "category_accuracy": round(float(np.mean(category_index(y) == category_index(pred))), 3),
        "within_one_category": round(float(np.mean(np.abs(category_index(y) - category_index(pred)) <= 1)), 3),
        "persistence_mae": round(base, 2),
        "skill_vs_persistence": round(1 - mae / base, 3) if base > 0 else 0.0,
    }


def training_rows(base: pd.DataFrame, horizon: int, as_of: pd.Timestamp, timezone: str):
    X = features.horizon_frame(base, horizon, timezone)
    y = features.target(base, horizon)
    known = (X.index <= as_of - pd.Timedelta(hours=horizon)) & y.notna() & X["aqi"].notna()
    return X[known], y[known]


def chronological_split(index: pd.DatetimeIndex, holdout: float, horizon: int):
    """Earlier rows for fitting, the latest `holdout` share for evaluation, with an embargo of
    `horizon` hours so no fitting target falls inside the evaluation period."""
    start = index[int(len(index) * (1 - holdout))]
    return index <= start - pd.Timedelta(hours=horizon), index >= start


def _evaluate_horizon(cfg: dict[str, Any], X: pd.DataFrame, y: pd.Series, h: int) -> dict[str, Any]:
    is_train, is_test = chronological_split(X.index, cfg["model"]["test_fraction"], h)
    X_tr, y_tr, X_te, y_te = X[is_train], y[is_train], X[is_test], y[is_test]
    if len(X_tr) < 1000 or len(X_te) < 200:
        raise ValueError(f"not enough labelled rows to train the {h} h model ({len(X)})")

    is_fit, is_val = chronological_split(X_tr.index, 0.15, h)
    val_mae = {}
    for kind in TARGET_KINDS:
        model = AqiModel.fit(cfg, X_tr[is_fit], y_tr[is_fit], kind)
        val_mae[kind] = mean_absolute_error(y_tr[is_val], model.predict(X_tr[is_val]))
    kind = min(val_mae, key=val_mae.get)

    model = AqiModel.fit(cfg, X_tr, y_tr, kind)
    metrics = _metrics(y_te.to_numpy(), model.predict(X_te), X_te["aqi"].to_numpy())
    accepted = metrics["skill_vs_persistence"] >= cfg["model"]["min_skill_vs_persistence"] and metrics["r2"] > 0
    log.info("h=%sh %s model: MAE %.1f vs persistence %.1f (skill %+.0f%%, category accuracy %.0f%%) -> %s",
             h, kind, metrics["mae"], metrics["persistence_mae"], 100 * metrics["skill_vs_persistence"],
             100 * metrics["category_accuracy"], "model" if accepted else "persistence fallback")
    return {"accepted": bool(accepted), "method": "model" if accepted else "persistence", "target_kind": kind,
            **metrics, "train_rows": int(len(X_tr)), "test_rows": int(len(X_te)),
            "test_period": [X_te.index[0].isoformat(), X_te.index[-1].isoformat()]}


def train(base: pd.DataFrame, cfg: dict[str, Any], as_of: pd.Timestamp, timezone: str,
          model_dir: Path, data_quality_score: float | None) -> dict[str, Any]:
    """Evaluate each horizon, refit accepted ones on all data and register the version."""
    version = f"v{as_of.strftime('%Y%m%dT%H%MZ')}"
    entry: dict[str, Any] = {"version": version, "trained_at": pd.Timestamp.now(tz="UTC").isoformat(),
                             "as_of": as_of.isoformat(), "data_quality_score": data_quality_score,
                             "horizons": {}, "promoted": False}
    accepted = {}
    for h in cfg["horizons_hours"]:
        X, y = training_rows(base, h, as_of, timezone)
        result = _evaluate_horizon(cfg, X, y, h)
        entry["horizons"][str(h)] = result
        if result["accepted"]:
            accepted[h] = (X, y, result["target_kind"])

    if accepted:
        path = model_dir / version
        path.mkdir(parents=True, exist_ok=True)
        for h, (X, y, kind) in accepted.items():
            joblib.dump(AqiModel.fit(cfg, X, y, kind), path / f"model_h{h}.joblib")
        entry["features_by_horizon"] = {str(h): list(X.columns) for h, (X, _, _) in accepted.items()}
        entry["training_period"] = [base["aqi"].first_valid_index().isoformat(), as_of.isoformat()]
        entry["promoted"] = True
        (path / "metadata.json").write_text(json.dumps(entry, indent=2), encoding="utf-8")
        (model_dir / "champion.json").write_text(json.dumps({"version": version}, indent=2), encoding="utf-8")
        log.info("promoted %s to champion", version)
    else:
        log.warning("no horizon beat persistence; champion unchanged")

    registry = [r for r in _read_json(model_dir / "registry.json", []) if r["version"] != version]
    registry.append({k: v for k, v in entry.items() if k != "features_by_horizon"})
    (model_dir / "registry.json").write_text(json.dumps(registry, indent=2), encoding="utf-8")
    return entry


def load_champion(model_dir: Path) -> Champion | None:
    pointer = _read_json(model_dir / "champion.json", None)
    if not pointer:
        return None
    path = model_dir / pointer["version"]
    return Champion(pointer["version"], path, _read_json(path / "metadata.json", {}))


def _read_json(path: Path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
