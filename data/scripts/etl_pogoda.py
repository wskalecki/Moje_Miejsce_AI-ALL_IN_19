#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: road weather stations → data/poi/environment.geojson (docs/data/poi-schema.md).

Catalog slug: `pogoda` (API action `get_zom_pogoda`), licence CC BY — Urząd m.st. Warszawy.

Latest reading only (refreshed every 10 minutes). Includes road surface temperature
(`temp_naw`), which ordinary weather services do not publish.

    uv run data/scripts/etl_pogoda.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_pogoda.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "pogoda"
ACTION = "zom_pogoda"
OUT_PATH = DATA_DIR / "poi" / "environment.geojson"

READINGS = {
    "temp_pow": "temperatura_powietrza",
    "temp_naw": "temperatura_nawierzchni",
    "wilg_pow": "wilgotnosc",
    "pred_wiatru": "wiatr_predkosc",
    "kier_wiatru": "wiatr_kierunek",
    "int_opadu": "opad",
}


def number(value: Any) -> float | None:
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None


def normalize(station: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    try:
        lon, lat = float(station["lon"]), float(station["lat"])
    except (KeyError, TypeError, ValueError):
        return None
    name = (station.get("lokalizacja") or "").strip()
    if not name:
        return None
    when = station.get("czas")
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=hashlib.sha1(name.encode()).hexdigest()[:12],
        category="environment",
        subtype="weather_station",
        name=name,
        districts=districts,
        meta={
            **{key: number(station.get(raw)) for raw, key in READINGS.items()},
            "czas_pomiaru": when.replace(" ", "T") if isinstance(when, str) else None,
        },
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        stations = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    pois = [p for p in (normalize(s, districts) for s in stations) if p]
    kept = merge_into(args.output, SLUG, pois)
    print(
        f"OK: {len(pois)} stacji pogodowych → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(stations)}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
