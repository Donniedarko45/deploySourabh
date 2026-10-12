"""Airflow DAG (Airflow 2.4+): run the AQI pipeline every hour for every configured city.

Install the requirements on the Airflow workers, put the aqi-pipeline folder on PYTHONPATH
and copy this file into Airflow's dags/ folder. Set AQI_PIPELINE_CONFIG to use a config
other than aqi-pipeline/config.yaml.

Each stage is its own task, so the Airflow UI shows exactly where a run stopped and only that
task is retried. A failed quality gate is a data problem, not a glitch, so it fails at once
without retries. Cities run in parallel and do not block each other.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.exceptions import AirflowFailException
from airflow.models.baseoperator import chain
from airflow.operators.python import PythonOperator
from airflow.utils.task_group import TaskGroup

from aqi_pipeline.config import load_config
from aqi_pipeline.pipeline import STAGES, RunContext, run_stage
from aqi_pipeline.quality import QualityGateError

CONFIG = os.environ.get("AQI_PIPELINE_CONFIG")


def _run(stage: str, city: str, data_interval_end, **_):
    ctx = RunContext.create(load_config(CONFIG), city, data_interval_end)
    try:
        run_stage(stage, ctx)
    except QualityGateError as exc:
        raise AirflowFailException(f"{exc}; see {exc.report_path}") from exc


with DAG(
    dag_id="aqi_forecast",
    schedule="5 * * * *",  # hourly, five minutes past the hour once the data has landed
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,  # incremental ingestion expects runs in order
    default_args={"retries": 3, "retry_delay": timedelta(minutes=2), "retry_exponential_backoff": True},
    tags=["air-quality", "ml"],
) as dag:
    for city in load_config(CONFIG)["cities"]:
        with TaskGroup(group_id=city):
            chain(*[PythonOperator(task_id=stage, python_callable=_run,
                                   op_kwargs={"stage": stage, "city": city}) for stage in STAGES])
