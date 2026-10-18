#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: city-managed car parks → data/poi/amenities.geojson (docs/data/poi-schema.md).

Catalog slug: `wolne-miejsca-parkingowe` (API action `get_m_parkingi_wolne_miejsca`),
licence CC BY — Urząd m.st. Warszawy.

The API refreshes free spaces every minute; the ETL keeps the car park itself plus a snapshot
of free spaces with its timestamp (`meta.wolne_*`, `meta.stan_na`). Coordinates arrive as strings.
Manager phones and e-mails are not copied.

    uv run data/scripts/etl_parkingi.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_parkingi.py --offline  # rebuild from data/raw/{slug}/
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

SLUG = "wolne-miejsca-parkingowe"
ACTION = "m_parkingi_wolne_miejsca"
OUT_PATH = DATA_DIR / "poi" / "amenities.geojson"


def text(value: Any) -> str | None:
    return (value.strip() or None) if isinstance(value, str) else None


def total(levels: Any, key: str) -> int | None:
    if not isinstance(levels, list) or not levels:
        return None
    values = [lvl.get(key) for lvl in levels if isinstance(lvl, dict)]
    return sum(int(v) for v in values if isinstance(v, (int, float))) if any(
        isinstance(v, (int, float)) for v in values) else None


def normalize(park: dict[str, Any], snapshot_time: str | None, districts: Districts) -> dict[str, Any] | None:
    try:
        lon, lat = float(park["longitude"]), float(park["latitude"])
    except (KeyError, TypeError, ValueError):
        return None
    name = text(park.get("name"))
    if not name:
        return None
    free = park.get("free_places_total") or {}
    hours = (park.get("opening_hours") or [None])[0]
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=hashlib.sha1(name.encode()).hexdigest()[:12],
        category="amenity",
        subtype="parking",
        name=name,
        districts=districts,
        tags=[t for t in (text(park.get("parkingCategory")), text(park.get("additionalSecurity"))) if t],
        meta={
            "adres": text(park.get("adress")),
            "miejsca": total(park.get("total_places"), "standard"),
            "miejsca_niepelnosprawni": total(park.get("total_places"), "disabled"),
            "miejsca_elektryczne": total(park.get("total_places"), "electric"),
            "wolne": free.get("public"),
            "wolne_niepelnosprawni": free.get("disabled"),
            "wolne_elektryczne": free.get("electric"),
            "stan_na": snapshot_time,
            "platnosci": text(park.get("acceptedPaymentMethod")),
            "pojazdy": text(park.get("allowedVehicleType")),
            "zarzadca": text(park.get("manager")),
            "godziny": hours if isinstance(hours, dict) else None,
        },
    )


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

    parks = data.get("carParks") or []
    pois = [p for p in (normalize(park, data.get("Timestamp"), districts) for park in parks) if p]
    kept = merge_into(args.output, SLUG, pois)
    print(
        f"OK: {len(pois)} parkingów → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(parks)}, stan wolnych miejsc na: {data.get('Timestamp')}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
