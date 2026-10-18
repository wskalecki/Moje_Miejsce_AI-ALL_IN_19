#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: participatory budget projects → data/poi/future.geojson (docs/data/poi-schema.md).

Catalog slug: `budzet-obywatelski` (API action `get_cks_budzet_obywatelski`),
licence CC BY — Urząd m.st. Warszawy.

The API needs `{"rok": YYYY, "status": "w_realizacji" | "zrealizowane"}` (HTTP 500 without them)
and returns `status: "5"` for every row, so the status comes from the query. Projects in progress
become `bo_project` (what will change here), finished ones `bo_done`.

Records carry authors' names, co-creators, comments and attachments. Only the whitelisted public
fields in `meta` are copied (RODO). List fields (`pins`, `classifications`, `recipients`) arrive as
Python-repr strings, so they are parsed with `ast.literal_eval`.

    uv run data/scripts/etl_budzet_obywatelski.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_budzet_obywatelski.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import ast
import sys
from datetime import date
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "budzet-obywatelski"
ACTION = "cks_budzet_obywatelski"
OUT_PATH = DATA_DIR / "poi" / "future.geojson"
FIRST_YEAR = 2019
STATUSES = {"w_realizacji": "bo_project", "zrealizowane": "bo_done"}
MAX_PINS = 5


def listed(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if not isinstance(value, str) or not value.strip():
        return []
    try:
        parsed = ast.literal_eval(value)
    except (ValueError, SyntaxError):
        return []
    return parsed if isinstance(parsed, list) else []


def text(value: Any) -> str | None:
    return (value.strip() or None) if isinstance(value, str) else None


def points(project: dict[str, Any]) -> list[tuple[float, float]]:
    out = []
    for pin in listed(project.get("pins"))[:MAX_PINS]:
        try:
            out.append((float(pin["lng"]), float(pin["lat"])))
        except (KeyError, TypeError, ValueError):
            continue
    if not out:
        try:
            out.append((float(project["lng"]), float(project["lat"])))
        except (KeyError, TypeError, ValueError):
            pass
    return out


def normalize(project: dict[str, Any], year: int, status: str, districts: Districts) -> list[dict[str, Any]]:
    pid = text(str(project.get("id") or ""))
    if not pid:
        return []
    found = points(project)
    try:
        cost = round(float(project["cost"]))
    except (KeyError, TypeError, ValueError):
        cost = None
    classes = [c for c in listed(project.get("classifications")) if isinstance(c, str)]
    url = text(project.get("url"))
    pois = []
    for i, (lon, lat) in enumerate(found):
        poi = point_feature(
            lon,
            lat,
            source=SLUG,
            source_id=pid if len(found) == 1 else f"{pid}_{i}",
            category="future",
            subtype=STATUSES[status],
            name=text(project.get("title")),
            districts=districts,
            tags=classes,
            meta={
                "status": status,
                "edycja": year,
                "numer": text(str(project.get("number") or "")),
                "opis": text(project.get("shortDescription")),
                "koszt_zl": cost,
                "dla_kogo": [r for r in listed(project.get("recipients")) if isinstance(r, str)],
                "lokalizacja": text(project.get("localization")),
                "obszar": text(project.get("mainRegionName")),
                "url": url if url and url.startswith(("http://", "https://")) else None,
            },
        )
        if poi:
            pois.append(poi)
    return pois


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("--from-year", type=int, default=FIRST_YEAR)
    parser.add_argument("--to-year", type=int, default=date.today().year + 1)
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    pois, seen, projects, without_point = [], set(), 0, 0
    for year in range(args.from_year, args.to_year + 1):
        for status in STATUSES:
            try:
                data = fetch(ACTION, f"{SLUG}/{year}-{status}", {"rok": year, "status": status},
                             offline=args.offline)
            except ApiError as e:
                print(f"BŁĄD ({year}, {status}): {e}", file=sys.stderr)
                return 1
            rows = data if isinstance(data, list) else data.get("result") or []
            for project in rows:
                projects += 1
                found = normalize(project, year, status, districts)
                without_point += not found
                for poi in found:
                    if poi["id"] not in seen:
                        seen.add(poi["id"])
                        pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    in_progress = sum(p["properties"]["subtype"] == "bo_project" for p in pois)
    print(
        f"OK: {len(pois)} punktów BO → {args.output.relative_to(DATA_DIR.parent)} "
        f"(projektów: {projects}, bez punktu lub poza Warszawą: {without_point}, "
        f"w realizacji: {in_progress}, zrealizowane: {len(pois) - in_progress}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
