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
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from generate_grid import assign_cell, district_at, load_districts
from poi_common import Districts
from um_api import DATA_DIR, ApiError, fetch

SLUG = "utrudnienia-w-ruchu-drogowym"
ACTION = "bin_utrudnienia_drogowe"
OUT_PATH = DATA_DIR / "lines" / "utrudnienia.geojson"
SAMPLE_M = 20  # well under the grid cell side, so no crossed cell is skipped

Coord = tuple[float, float]


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


def geometry(lines: list[list[Coord]]) -> dict[str, Any]:
    rounded = [[[round(lon, 6), round(lat, 6)] for lon, lat in line] for line in lines]
    if all(len(line) == 1 for line in rounded):
        points = [line[0] for line in rounded]
        return {"type": "Point", "coordinates": points[0]} if len(points) == 1 else \
            {"type": "MultiPoint", "coordinates": points}
    lines_only = [line for line in rounded if len(line) > 1]
    return {"type": "LineString", "coordinates": lines_only[0]} if len(lines_only) == 1 else \
        {"type": "MultiLineString", "coordinates": lines_only}


def metres(a: Coord, b: Coord) -> float:
    dx = (b[0] - a[0]) * 111_320 * math.cos(math.radians((a[1] + b[1]) / 2))
    dy = (b[1] - a[1]) * 110_540
    return math.hypot(dx, dy)


def sample(line: list[Coord]) -> list[Coord]:
    if len(line) == 1:
        return list(line)
    out = []
    for a, b in zip(line, line[1:]):
        steps = max(1, math.ceil(metres(a, b) / SAMPLE_M))
        out += [(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps) for i in range(steps)]
    return out + [line[-1]]


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
    points = [pt for line in lines for pt in sample(line)]
    if districts:
        inside = [pt for pt in points if district_at(*pt, districts)]
        if not inside:
            return None  # entirely outside Warsaw
        found = {district_at(*pt, districts) for pt in inside}
    else:
        inside, found = points, set()
    sid = str(raw["id"])
    return {
        "type": "Feature",
        "id": f"{SLUG}_{sid}",
        "geometry": geometry(lines),
        "properties": {
            "id": f"{SLUG}_{sid}",
            "category": "traffic",
            "subtype": "road_works",
            "name": (raw.get("name") or "").strip() or None,
            "source": SLUG,
            "sourceId": sid,
            "cell_ids": sorted({assign_cell(*pt) for pt in inside}),
            "districts": sorted(found),
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
    args.output.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "type": "FeatureCollection",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "features": features,
    }
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    cells = {c for f in features for c in f["properties"]["cell_ids"]}
    print(
        f"OK: {len(features)} utrudnień → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(rows)}, odrzucone bez geometrii lub poza Warszawą: {len(rows) - len(features)}, "
        f"komórek dotkniętych: {len(cells)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
