# AQI prediction pipeline

An automated pipeline that forecasts a city's **Air Quality Index** (Indian National AQI,
CPCB) 6, 12 and 24 hours ahead. A data quality layer checks, repairs and gates the data
before any model sees it.

> Problem 3: *Design an automated pipeline for predicting the Air Quality Index of a city.*
> The design, with the reasoning and the data quality mapping, is in **[DESIGN.md](DESIGN.md)**.

```
ingest -> validate (contract, source health, clean, CPCB AQI, quality gate) -> features
       -> monitor (live skill, drift, age) -> train (when needed, must beat baseline) -> forecast + alerts
```

## Quick start

```bash
cd aqi-pipeline
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Live data for Delhi (Open-Meteo, no API key). The first run downloads 2 years of history.
python -m aqi_pipeline run

# Offline: deterministic synthetic data with injected sensor faults
python -m aqi_pipeline run --source synthetic
```

The forecast is written to `store/forecasts/delhi/latest.json`:

```json
{
  "city": "Delhi",
  "issued_at": "2026-10-12T06:00:00+00:00",
  "current": {"aqi": 162.0, "category": "Moderate", "prominent_pollutant": "pm25"},
  "forecasts": [
    {"horizon_h": 24, "valid_at_local": "2026-10-13 11:30 IST", "aqi": 148, "category": "Moderate",
     "health_advisory": "Breathing discomfort to people with lung disease ...",
     "method": "model", "expected_abs_error": 15.28}
  ]
}
```

(Values from a synthetic-data run; they illustrate the format only.)

## Commands

| Command | What it does |
|---|---|
| `python -m aqi_pipeline run` | Whole pipeline once, for the configured city, at the current hour |
| `... run --city all` | Every city in `config.yaml` (each independent) |
| `... run --as-of 2026-01-15T06:00Z` | Replay a past hour exactly as it would have run then |
| `... run --force-train` | Retrain even if monitoring says the model is fine |
| `... stage validate --as-of ...` | One stage (`ingest`, `validate`, `features`, `monitor`, `train`, `forecast`) |
| `... backfill --start 2026-01-01 --end 2026-01-31 --every-hours 24` | Replay scheduled runs over a period |
| `pytest` | 33 tests: AQI maths, quality checks, cleaning, end-to-end runs |

Exit codes: `0` success, `2` quality gate failed, `3` data source unavailable, `1` other error.

## Automating it

* **Airflow**: `dags/aqi_forecast_dag.py` runs hourly, one task group per city and one task
  per stage, with retries for transient errors and no retries for a failed quality gate.
* **cron**: `5 * * * * cd /path/to/aqi-pipeline && .venv/bin/python -m aqi_pipeline run --city all >> run.log 2>&1`
* **Alerts**: set `AQI_ALERT_WEBHOOK_URL` (for example a Slack incoming webhook) to receive a
  message when any horizon is forecast at 301 (Very Poor) or above.

## What a run produces (`store/`)

| Path | Contents |
|---|---|
| `bronze/<city>/batch_<time>.csv` + `.meta.json` | Raw data as received, with units, request and SHA-256 |
| `silver/<city>/clean_<time>.csv` | Clean hourly data with sub-indices, AQI, category |
| `gold/<city>/features_<time>.csv` | Model features |
| `reports/<city>/dq_<time>.md` | **Data quality report**: every check, its dimension, result, and what cleaning changed |
| `reports/<city>/monitor_<time>.json` | Live skill vs persistence, drift (PSI), retrain decision |
| `reports/<city>/run_<time>.json` | Stage statuses and timings |
| `models/<city>/` | Model versions with metrics, `champion.json`, `registry.json` |
| `forecasts/<city>/latest.json`, `predictions_log.csv` | Current forecast; every forecast ever made |

## Configuration

`config.yaml` sets the cities (add one with its coordinates and time zone), the source,
history length, horizons, every quality threshold, model settings, monitoring rules and the
alert threshold.

## Code map

| Module | Responsibility |
|---|---|
| `sources.py` | Open-Meteo client (chunked, retries) and the synthetic generator with fault injection |
| `standardize.py` | Canonical names, declared-unit conversion, UTC |
| `quality.py` | Contract, source-health and fitness-gate checks; DQ report |
| `cleaning.py` | Merge batches, remove bad values, fill only short gaps |
| `aqi.py` | CPCB sub-indices, AQI, categories, health advisories |
| `features.py` | Lags, rolling statistics, weather forecast at the target hour, calendar |
| `modeling.py` | Per-horizon models, chronological evaluation vs persistence, registry |
| `monitoring.py` | Live scoring, seasonal drift, retrain decision |
| `forecast.py` | Forecast output, prediction log, alerts |
| `pipeline.py` | Stage functions, storage layout, run orchestration |
