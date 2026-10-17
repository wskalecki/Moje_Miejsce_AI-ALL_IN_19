"""Command line: uv run siatka {run,list,grid}."""

from __future__ import annotations

import argparse
import logging
import subprocess
import sys

from siatka.config import SCRIPTS_DIR
from siatka.grid import Grid
from siatka.indicators import discover
from siatka.model import DATASETS
from siatka.personas import PERSONAS


def cmd_list(_: argparse.Namespace) -> int:
    indicators = discover()
    print(f"{len(indicators)} wskaźników, {len(DATASETS)} zbiorów, persony: {', '.join(PERSONAS)}\n")
    for ind in indicators:
        print(f"  {ind.category:<14} {ind.key:<30} {ind.label}  [{', '.join(ind.datasets)}]")
    used = {k for ind in indicators for k in ind.datasets}
    weighted = {k for cfg in PERSONAS.values() for k in cfg["weights"]}
    missing = sorted(weighted - {i.key for i in indicators})
    if missing:
        print(f"\nWagi person bez wskaźnika (jeszcze nie zaimplementowane): {', '.join(missing)}")
    unused = sorted(set(DATASETS) - used)
    if unused:
        print(f"Zbiory bez wskaźnika (tylko warstwa POI): {', '.join(unused)}")
    return 0


def cmd_grid(_: argparse.Namespace) -> int:
    grid = Grid.build()
    grid.save()
    print(f"Siatka: {len(grid.cells)} komórek w granicach Warszawy")
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    from siatka.output import write_all
    from siatka.pipeline import run

    indicators = discover()
    if args.only:
        indicators = [i for i in indicators if i.key in args.only]
    result = run(indicators)
    paths = write_all(result)
    if result.ctx.failures:
        print("\nNiedostępne zbiory (metryki = null):")
        for key, err in result.ctx.failures.items():
            print(f"  {key}: {err[:120]}")
    print(f"\nZapisano: {', '.join(paths.values())}")
    return subprocess.call([sys.executable, str(SCRIPTS_DIR / "validate_data.py")])


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(prog="siatka", description="Siatka ETL")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="wypisz wskaźniki i zbiory").set_defaults(fn=cmd_list)
    sub.add_parser("grid", help="zapisz tylko siatkę").set_defaults(fn=cmd_grid)
    p_run = sub.add_parser("run", help="pobierz dane, policz metryki i zapisz pliki kontraktu")
    p_run.add_argument("--only", nargs="+", metavar="KEY", help="tylko wybrane wskaźniki")
    p_run.set_defaults(fn=cmd_run)
    args = parser.parse_args()
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
