#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: waste and reuse points → data/poi/amenities.geojson (docs/data/poi-schema.md).

Catalog slug: `eko-punkty` (API action `get_bos_ekopunkty`), licence CC BY — Urząd m.st. Warszawy.

Point types become subtypes: medicine drop-off (`medicine_disposal`), e-waste containers and
collection points (`e_waste`), PSZOK fixed and mobile (`waste_collection`), food sharing
fridges (`food_sharing`). The dataset has no IDs; contact e-mails and phones are not copied.

    uv run data/scripts/etl_ekopunkty.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_ekopunkty.py --offline  # rebuild from data/raw/{slug}/
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

SLUG = "eko-punkty"
ACTION = "bos_ekopunkty"
OUT_PATH = DATA_DIR / "poi" / "amenities.geojson"

SUBTYPES = {
    "Odbiór przeterminowanych leków": "medicine_disposal",
    "Miejski Punkt Elektroodpadów": "e_waste",
    "Pojemnik na małe elektrośmieci": "e_waste",
    "Mobilny punkt zbierania elektrośmieci": "e_waste",
    "Punkt Selektywnego Zbierania Odpadów Komunalnych": "waste_collection",
    "Mobilny Punkt Selektywnego Zbierania Odpadów Komunalnych": "waste_collection",
    "Jadłodzielnia": "food_sharing",
}
DAYS = ("poniedzialek", "wtorek", "sroda", "czwartek", "piatek", "sobota", "niedziela")


def text(value: Any) -> str | None:
    return (value.strip() or None) if isinstance(value, str) else None


def opening_hours(point: dict[str, Any]) -> dict[str, str | None] | None:
    schedule = (point.get("dni_pracy") or [None])[0]
    if not isinstance(schedule, dict):
        return None
    out = {}
    for day in DAYS:
        d = schedule.get(day) or {}
        if d.get("nieczynne"):
            out[day] = "nieczynne"
        elif d.get("calodobowo"):
            out[day] = "całodobowo"
        elif d.get("otwarta_od") and d.get("otwarta_do"):
            out[day] = f"{d['otwarta_od']}–{d['otwarta_do']}"
        else:
            out[day] = None
    return out


def normalize(point: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    try:
        lon, lat = float(point["dlugosc"]), float(point["szerokosc"])
    except (KeyError, TypeError, ValueError):
        return None
    kinds = [t["rodzaj"] for t in point.get("typ_punktu") or [] if t.get("rodzaj")]
    if not kinds:
        return None
    subtype = SUBTYPES.get(kinds[0], "waste_other")
    address = " ".join(x for x in (text(point.get("ulica")), text(point.get("ulica_numer"))) if x)
    sid = hashlib.sha1(f"{lon:.5f},{lat:.5f},{address},{kinds[0]}".encode()).hexdigest()[:12]
    hours = opening_hours(point)
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=sid,
        category="amenity",
        subtype=subtype,
        name=text(point.get("nazwa")) or kinds[0],
        districts=districts,
        tags=kinds,
        meta={
            "rodzaj": kinds[0],
            "adres": address or None,
            "opis_lokalizacji": text(point.get("opis_lokalizacji")),
            "calodobowo": all(v == "całodobowo" for v in hours.values()) if hours else None,
            "godziny": hours,
        },
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        points = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    pois, seen = [], set()
    for point in points:
        poi = normalize(point, districts)
        if poi and poi["id"] not in seen:
            seen.add(poi["id"])
            pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    by_type: dict[str, int] = {}
    for p in pois:
        by_type[p["properties"]["subtype"]] = by_type.get(p["properties"]["subtype"], 0) + 1
    print(
        f"OK: {len(pois)} eko-punktów → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(points)}, odrzucone: {len(points) - len(pois)}, podtypy: {by_type}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
