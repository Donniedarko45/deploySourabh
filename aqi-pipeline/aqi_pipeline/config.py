"""Configuration loading and validation."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "config.yaml"
SOURCES = ("open_meteo", "synthetic")


class ConfigError(ValueError):
    pass


def load_config(path: str | Path | None = None, **overrides: Any) -> dict[str, Any]:
    """Read the YAML config; keyword overrides that are not None replace top-level keys."""
    path = Path(path) if path else DEFAULT_CONFIG
    with path.open(encoding="utf-8") as fh:
        cfg = yaml.safe_load(fh)
    cfg["_base_dir"] = str(path.resolve().parent)
    for key, value in overrides.items():
        if value is not None:
            cfg[key] = value
    _validate(cfg)
    return cfg


def city_keys(cfg: dict[str, Any], city: str | None = None) -> list[str]:
    """Resolve a city argument ("all" or a key) to a list of configured city keys."""
    city = city or cfg["city"]
    if city == "all":
        return list(cfg["cities"])
    if city not in cfg["cities"]:
        raise ConfigError(f"unknown city {city!r}; configured: {', '.join(cfg['cities'])}")
    return [city]


def _validate(cfg: dict[str, Any]) -> None:
    for key in ("cities", "source", "storage_root", "history_days", "horizons_hours", "quality", "model"):
        if key not in cfg:
            raise ConfigError(f"missing config key: {key}")
    if cfg["source"] not in SOURCES:
        raise ConfigError(f"source must be one of {SOURCES}, got {cfg['source']!r}")
    horizons = cfg["horizons_hours"]
    if not horizons or any(int(h) < 1 for h in horizons):
        raise ConfigError("horizons_hours must be positive integers")
    for key, city in cfg["cities"].items():
        for field in ("name", "latitude", "longitude", "timezone"):
            if field not in city:
                raise ConfigError(f"city {key!r} is missing {field!r}")
