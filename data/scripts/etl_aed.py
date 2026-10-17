#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: public defibrillators (AED) → data/poi/amenities.geojson (docs/data/poi-schema.md).

Catalog slug: `lokalizacja-defibryzatorow-aed` (sic, typo in the portal slug; API action
`get_scb_lokalizacja_defibrylatorow`), licence CC BY — Urząd m.st. Warszawy.
Coordinates arrive nested as `[[lon, lat]]`.

    uv run data/scripts/etl_aed.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_aed.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "lokalizacja-defibryzatorow-aed"
ACTION = "scb_lokalizacja_defibrylatorow"
OUT_PATH = DATA_DIR / "poi" / "amenities.geojson"


def text(value: Any) -> str | None:
    return (value.strip() or None) if isinstance(value, str) else value


def round_the_clock(availability: str | None) -> bool | None:
    """`device_availability` is "Tak" (24/7), "Nie", "Ograniczona", or free text with hours."""
    if availability == "Tak":
        return True
    if availability and (availability in ("Nie", "Ograniczona") or availability.startswith(("Nie", "dostęp w godz"))):
        return False
    return None


def lon_lat(geometry: dict[str, Any] | None) -> tuple[float, float] | None:
    coords = (geometry or {}).get("coordinates")
    while isinstance(coords, list) and coords and isinstance(coords[0], list):
        coords = coords[0]
    try:
        return float(coords[0]), float(coords[1])
    except (TypeError, ValueError, IndexError):
        return None


def normalize(raw: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    p = raw.get("properties") or {}
    point = lon_lat(raw.get("geometry"))
    device_id = text(str(p.get("defibrillator_id") or ""))
    if point is None or not device_id:
        return None
    availability = text(p.get("device_availability"))
    public = text(p.get("device_public_access"))
    address = " ".join(x for x in (text(p.get("location_street")), text(p.get("location_building"))) if x)
    always = round_the_clock(availability)
    tags = []
    if always:
        tags.append("calodobowy")
    if public == "Publiczny":
        tags.append("publiczny")
    return point_feature(
        *point,
        source=SLUG,
        source_id=device_id,
        category="amenity",
        subtype="aed",
        name=text(p.get("location_object_name")),
        districts=districts,
        tags=tags,
        meta={
            "calodobowy": always,
            "dostepnosc": availability,
            "godziny": text(p.get("device_access_description")),
            "dostep_publiczny": public,
            "umiejscowienie": text(p.get("device_location")),
            "opis_lokalizacji": text(p.get("location_description")),
            "adres": address or None,
        },
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        raw = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    pois, seen = [], set()
    for f in raw:
        poi = normalize(f, districts)
        if poi and poi["id"] not in seen:
            seen.add(poi["id"])
            pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    always = sum(p["properties"]["meta"]["calodobowy"] is True for p in pois)
    print(
        f"OK: {len(pois)} AED → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(raw)}, odrzucone: {len(raw) - len(pois)}, całodobowe: {always}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
