#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: air quality sensors → data/poi/environment.geojson (docs/data/poi-schema.md).

Catalog slug: `monitoring-jakosci-powietrza` (API action `get_bopipk_monitoring_jakosci_powietrza`),
licence CC BY — Urząd m.st. Warszawy.

The API returns only the latest hourly reading per station (no history). Stations in
neighbouring municipalities are kept (tag `poza_warszawa`) so interpolation near the
city border has data on both sides.

    uv run data/scripts/etl_powietrze.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_powietrze.py --offline  # rebuild from data/raw/{slug}/
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

SLUG = "monitoring-jakosci-powietrza"
ACTION = "bopipk_monitoring_jakosci_powietrza"
OUT_PATH = DATA_DIR / "poi" / "environment.geojson"

# City sensors report "PM2.5", GIOŚ reference stations "PM25".
PARAM_KEYS = {"PM2.5": "pm25", "PM25": "pm25", "PM10": "pm10", "PM1": "pm1", "NO2": "no2", "O3": "o3",
              "CO": "co", "SO2": "so2", "C6H6": "c6h6", "T": "temperature", "P": "pressure", "H": "humidity"}
REPORTED = ("pm25", "pm10", "no2")


def readings(station: dict[str, Any]) -> tuple[dict[str, float | None], dict[str, str], str | None]:
    values: dict[str, float | None] = {key: None for key in REPORTED}
    units: dict[str, str] = {}
    time = None
    for d in station.get("data") or []:
        key = PARAM_KEYS.get(d.get("param_code"))
        if key is None or d.get("value") is None:
            continue
        values[key] = round(float(d["value"]), 2)
        units[key] = d.get("unit")
        time = time or d.get("time")
    return values, units, time


def normalize(station: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    try:
        lon, lat = float(station["lon"]), float(station["lat"])
    except (KeyError, TypeError, ValueError):
        return None
    name = station.get("name")
    if not name:
        return None
    values, units, time = readings(station)
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=hashlib.sha1(name.encode()).hexdigest()[:12],
        category="environment",
        subtype="air_sensor",
        name=name,
        districts=districts,
        tags=["stacja_referencyjna"] if station.get("station_type") == "Stacja monitoringu" else [],
        meta={
            **values,
            "jednostki": units,
            "czas_pomiaru": time.replace(" ", "T") if time else None,
            "indeks": (station.get("ijp") or {}).get("name"),
            "wlasciciel": station.get("owner"),
            "typ_stacji": station.get("station_type"),
        },
        keep_outside=True,
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

    pois, seen = [], set()
    for st in stations:
        poi = normalize(st, districts)
        if poi and poi["id"] not in seen:
            seen.add(poi["id"])
            pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    outside = sum("poza_warszawa" in p["properties"]["tags"] for p in pois)
    no_pm25 = sum(p["properties"]["meta"]["pm25"] is None for p in pois)
    print(
        f"OK: {len(pois)} stacji → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(stations)}, poza Warszawą: {outside}, bez PM2.5: {no_pm25}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
