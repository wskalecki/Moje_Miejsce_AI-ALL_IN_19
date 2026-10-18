#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: public toilets → data/poi_mikolaj/amenities.geojson (docs/data/poi-schema.md).

Catalog slug: `toalety` (API action `get_m_toalety`), licence CC BY — Urząd m.st. Warszawy.
`cell_id` comes from the team grid (`assign_cell` in generate_grid.py), whatever its version.

    uv run data/scripts/etl_toalety.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_toalety.py --offline  # rebuild from data/raw/toalety/

Only features with `source == "toalety"` are replaced in amenities.geojson, so other
amenity ETLs can write to the same file.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import POI_DIR, Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "toalety"
ACTION = "m_toalety"
OUT_PATH = POI_DIR / "amenities.geojson"


def flag(value: Any) -> bool | None:
    """Portal encodes yes/no as 1/0; anything else is unknown."""
    if value in (1, "1"):
        return True
    if value in (0, "0"):
        return False
    return None


def source_id(lon: float, lat: float, location: str | None) -> str:
    # The portal has no stable ID; same scheme as data/scripts/siatka (um_toilets) so IDs match.
    return hashlib.sha1(f"{lon:.6f},{lat:.6f},{location}".encode()).hexdigest()[:12]


def features_of(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict) and data.get("type") == "FeatureCollection":
        return data["features"]
    if isinstance(data, list):
        return data
    raise ValueError("Nieznana struktura odpowiedzi: oczekiwano listy Feature lub FeatureCollection")


def normalize(raw: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    geom = raw.get("geometry") or {}
    coords = geom.get("coordinates") or []
    if geom.get("type") != "Point" or len(coords) < 2:
        return None
    lon, lat = float(coords[0]), float(coords[1])
    p = raw.get("properties") or {}

    changing_table = flag(p.get("przewijak"))
    accessible = flag(p.get("dostepnosc"))
    paid = flag(p.get("platnosc"))
    tags = [
        tag
        for tag, on in (("przewijak", changing_table), ("bez_barier", accessible), ("bezplatna", paid is False))
        if on
    ]
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=source_id(lon, lat, p.get("lokalizacja")),
        category="amenity",
        subtype="toilet",
        name=p.get("lokalizacja"),
        districts=districts,
        tags=tags,
        meta={
            "przewijak": changing_table,
            "bez_barier": accessible,
            "platna": paid,
            "godziny": p.get("godziny") or None,
            "aktu_dan": p.get("aktu_dan") or None,
        },
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/toalety/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    if not districts:
        print("UWAGA: brak data/boundaries/warszawa_dzielnice.geojson, district = null i brak filtra granic",
              file=sys.stderr)

    try:
        raw = features_of(fetch(ACTION, SLUG, offline=args.offline))
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
    with_table = sum(1 for p in pois if p["properties"]["meta"]["przewijak"])
    print(
        f"OK: {len(pois)} toalet → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(raw)}, odrzucone poza Warszawą/bez punktu/duplikaty: {len(raw) - len(pois)}, "
        f"z przewijakiem: {with_table}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
