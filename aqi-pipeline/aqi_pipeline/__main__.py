"""Command line entry point.

    python -m aqi_pipeline run                          # live data, configured city, now
    python -m aqi_pipeline run --city all --source synthetic
    python -m aqi_pipeline run --as-of 2026-01-15T06:00Z   # replay a past hour
    python -m aqi_pipeline stage validate --as-of ...   # one stage (used by Airflow)
    python -m aqi_pipeline backfill --start 2026-01-01 --end 2026-01-10 --every-hours 24

Exit codes: 0 success, 2 quality gate failed, 3 data source unavailable, 1 other error.
"""

from __future__ import annotations

import argparse
import logging
import sys

import pandas as pd

from .config import ConfigError, city_keys, load_config
from .pipeline import STAGES, RunContext, normalise_as_of, run, run_stage
from .quality import QualityGateError
from .sources import SourceError

log = logging.getLogger("aqi_pipeline")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="aqi_pipeline", description=__doc__.split("\n")[0])
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--config", help="path to config.yaml")
    common.add_argument("--city", help='city key from the config, or "all"')
    common.add_argument("--source", choices=["open_meteo", "synthetic"])
    common.add_argument("-v", "--verbose", action="store_true")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("run", parents=[common], help="run the whole pipeline once")
    p.add_argument("--as-of", help="run time (UTC unless an offset is given); default now")
    p.add_argument("--force-train", action="store_true", help="retrain even if monitoring says no")

    p = sub.add_parser("stage", parents=[common], help="run a single stage")
    p.add_argument("name", choices=STAGES)
    p.add_argument("--as-of", help="run time; must match the earlier stages")
    p.add_argument("--force-train", action="store_true")

    p = sub.add_parser("backfill", parents=[common], help="replay scheduled runs over a past period")
    p.add_argument("--start", required=True)
    p.add_argument("--end", required=True)
    p.add_argument("--every-hours", type=int, default=24)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s", datefmt="%H:%M:%S")
    try:
        cfg = load_config(args.config, source=args.source)
        cities = city_keys(cfg, args.city)
    except (ConfigError, FileNotFoundError) as exc:
        log.error("%s", exc)
        return 1

    if args.command == "backfill":
        times = pd.date_range(normalise_as_of(args.start), normalise_as_of(args.end),
                              freq=f"{args.every_hours}h")
    else:
        times = [normalise_as_of(args.as_of)]

    exit_code = 0
    for city in cities:  # cities are independent: one failing does not stop the others
        for as_of in times:
            ctx = RunContext(cfg, city, as_of)
            try:
                if args.command == "stage":
                    kwargs = {"force": args.force_train} if args.name == "train" else {}
                    run_stage(args.name, ctx, **kwargs)
                else:
                    run(ctx, force_train=getattr(args, "force_train", False))
            except QualityGateError as exc:
                log.error("%s (report: %s)", exc, exc.report_path.with_suffix(".md") if exc.report_path else "-")
                exit_code = max(exit_code, 2)
            except SourceError as exc:
                log.error("data source unavailable: %s", exc)
                exit_code = max(exit_code, 3)
            except Exception:
                log.exception("run failed for %s at %s", city, as_of)
                exit_code = max(exit_code, 1)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
