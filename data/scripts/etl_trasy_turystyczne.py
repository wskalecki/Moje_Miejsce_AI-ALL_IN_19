#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: city tourist routes → data/lines/trasy_turystyczne.geojson.

Catalog slug: `trasy-turystyczne` (API action `get_sbt_trasy_turystyczne`),
licence CC BY — Urząd m.st. Warszawy.

Routes are lines, not POI points (docs/data/poi-schema.md: line → intersecting cells), so each
feature lists the cells it crosses in `cell_ids`. `traces` arrive as `[lat, lon]` pairs, the
reverse of GeoJSON order; the route's stops are kept in `meta.punkty`.

    uv run data/scripts/etl_trasy_turystyczne.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_trasy_turystyczne.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path
from typing import Any

from generate_grid import assign_cell, load_districts
from poi_common import Coord, Districts, cells_crossed, line_geometry, write_collection
from um_api import DATA_DIR, ApiError, fetch

SLUG = "trasy-turystyczne"
ACTION = "sbt_trasy_turystyczne"
OUT_PATH = DATA_DIR / "lines" / "trasy_turystyczne.geojson"


def trace(route: dict[str, Any]) -> list[Coord]:
    out = []
    for pair in route.get("traces") or []:
        try:
            lat, lon = float(pair[0]), float(pair[1])
        except (TypeError, ValueError, IndexError):
            continue
        out.append((lon, lat))
    return out


def stops(route: dict[str, Any]) -> list[dict[str, Any]]:
    out = []
    for p in route.get("tourist_points") or []:
        try:
            lon, lat = float(p["latlng"]["lng"]), float(p["latlng"]["lat"])
        except (KeyError, TypeError, ValueError):
            continue
        out.append({"nazwa": (p.get("name") or "").replace("\xa0", " ").strip() or None,
                    "lon": round(lon, 6), "lat": round(lat, 6), "cell_id": assign_cell(lon, lat)})
    return out


def normalize(route: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    title = (route.get("title") or "").strip()
    line = trace(route)
    if not title or len(line) < 2:
        return None
    crossed = cells_crossed([line], districts)
    if crossed is None:
        return None
    cell_ids, found = crossed
    sid = hashlib.sha1(title.encode()).hexdigest()[:12]
    try:
        length = float(route["length"])
    except (KeyError, TypeError, ValueError):
        length = None
    return {
        "type": "Feature",
        "id": f"{SLUG}_{sid}",
        "geometry": line_geometry([line]),
        "properties": {
            "id": f"{SLUG}_{sid}",
            "category": "culture",
            "subtype": "tourist_route",
            "name": title,
            "source": SLUG,
            "sourceId": sid,
            "cell_ids": cell_ids,
            "districts": found,
            "tags": [],
            "meta": {
                "dlugosc_km": length,
                "opis": (route.get("description") or "").strip() or None,
                "punkty": stops(route),
            },
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        data = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    routes = data.get("result") if isinstance(data, dict) else data
    features = [f for f in (normalize(r, districts) for r in routes or []) if f]
    write_collection(args.output, features)
    cells = {c for f in features for c in f["properties"]["cell_ids"]}
    print(
        f"OK: {len(features)} tras → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(routes or [])}, komórek na trasach: {len(cells)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
