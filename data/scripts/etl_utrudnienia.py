#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: road works and closures → data/lines/utrudnienia.geojson.

Catalog slug: `utrudnienia-w-ruchu-drogowym` (API action `get_bin_utrudnienia_drogowe`),
licence CC BY — Urząd m.st. Warszawy.

Not POI points (docs/data/poi-schema.md: line → intersecting cells): each feature keeps
its line geometry and lists every grid cell it crosses in `cell_ids`. API geometry is
`geo = [[{"geomType": 0|1, "latlngs": [{lat, lng}, …]}]]`; type 0 is a single point.

    uv run data/scripts/etl_utrudnienia.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_utrudnienia.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import Coord, Districts, cells_crossed, line_geometry, write_collection
from um_api import DATA_DIR, ApiError, fetch

SLUG = "utrudnienia-w-ruchu-drogowym"
ACTION = "bin_utrudnienia_drogowe"
OUT_PATH = DATA_DIR / "lines" / "utrudnienia.geojson"


def parts(geo: Any) -> list[list[Coord]]:
    """API geometry → list of [lon, lat] vertex lists, one per drawn part."""
    out = []
    for group in geo or []:
        for part in group or []:
            coords = [(float(p["lng"]), float(p["lat"])) for p in part.get("latlngs") or []
                      if p.get("lat") is not None and p.get("lng") is not None]
            if coords:
                out.append(coords)
    return out


def local_time(value: str | None) -> str | None:
    """'2026-12-31 09:02:53' (Warsaw local time, no zone) → '2026-12-31T09:02:53'; '' → None."""
    try:
        return datetime.strptime(value.strip(), "%Y-%m-%d %H:%M:%S").isoformat() if value else None
    except ValueError:
        return None


def normalize(raw: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    lines = parts(raw.get("geo"))
    if not lines or raw.get("id") is None:
        return None
    crossed = cells_crossed(lines, districts)
    if crossed is None:
        return None  # entirely outside Warsaw
    cell_ids, found = crossed
    sid = str(raw["id"])
    return {
        "type": "Feature",
        "id": f"{SLUG}_{sid}",
        "geometry": line_geometry(lines),
        "properties": {
            "id": f"{SLUG}_{sid}",
            "category": "traffic",
            "subtype": "road_works",
            "name": (raw.get("name") or "").strip() or None,
            "source": SLUG,
            "sourceId": sid,
            "cell_ids": cell_ids,
            "districts": found,
            "tags": list(raw.get("detour_type") or []),
            "meta": {
                "od": local_time(raw.get("start_date")),
                "do": local_time(raw.get("end_date")),
                "ulice": list(raw.get("streets") or []),
                "opis": " ".join(raw.get("content") or []) or None,
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
        rows = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    features = [f for f in (normalize(r, districts) for r in rows) if f]
    write_collection(args.output, features)
    cells = {c for f in features for c in f["properties"]["cell_ids"]}
    print(
        f"OK: {len(features)} utrudnień → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(rows)}, odrzucone bez geometrii lub poza Warszawą: {len(rows) - len(features)}, "
        f"komórek dotkniętych: {len(cells)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
