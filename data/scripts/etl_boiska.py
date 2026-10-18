#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: school sports grounds open to residents → data/poi/sport.geojson (docs/data/poi-schema.md).

Catalog slug: `otwarte-boiska` (API action `get_be_otwarte_boiska`), licence CC BY — Urząd m.st. Warszawy.

The API has no coordinates, only `Adres obiektu`; points come from the city address
points (geocode_address.py). The API lists one row per facility type, so rows are grouped
into one POI per school and address, with the facilities in `meta.obiekty`.

    uv run data/scripts/etl_boiska.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_boiska.py --offline  # rebuild from data/raw/
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from geocode_address import Geocoder
from poi_common import Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "otwarte-boiska"
ACTION = "be_otwarte_boiska"
OUT_PATH = DATA_DIR / "poi" / "sport.geojson"
DAYS = ("Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela")


def yes_no(value: str | None) -> bool | None:
    return {"TAK": True, "NIE": False}.get((value or "").strip().upper())


def text(value: Any) -> str | None:
    value = (value or "").strip() if isinstance(value, str) else value
    return value or None


def facility(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "typ": text(row.get("Typ obiektu")),
        "zawiera": text(row.get("Boisk uniwersalne zawiera")),
        "nawierzchnia": text(row.get("Rodzaj nawierzchni")),
        "trybuny": yes_no(row.get("Obiekt wyposażony w trybuny")),
        "pilkochwyty": yes_no(row.get("Obiekt wyposażony w piłkochwyty")),
        "godziny": {day: text(row.get(day)) for day in DAYS},
    }


def group_rows(rows: list[dict[str, Any]]) -> dict[tuple[str, str], list[dict[str, Any]]]:
    groups: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for r in rows:
        address = text(r.get("Adres obiektu"))
        if address:
            groups.setdefault((address, text(r.get("Nazwa placówki oświatowej")) or ""), []).append(r)
    return groups


def normalize(address: str, school: str, rows: list[dict[str, Any]], geocoder: Geocoder,
              districts: Districts) -> dict[str, Any] | None:
    district = text(rows[0].get("Dzielnica"))
    hit = geocoder.geocode(address, district)
    if hit is None:
        return None
    facilities = [facility(r) for r in rows]
    types = sorted({f["typ"] for f in facilities if f["typ"]})
    return point_feature(
        hit.lon,
        hit.lat,
        source=SLUG,
        source_id=hashlib.sha1(f"{address}|{school}".encode()).hexdigest()[:12],
        category="sport",
        subtype="pitch",
        name=school or address,
        districts=districts,
        tags=types,
        meta={
            "adres": address,
            "dzielnica_zrodlo": district,
            "geokodowanie": hit.precision,
            "liczba_obiektow": len(facilities),
            "obiekty": facilities,
            "uwagi": sorted({u for r in rows if (u := text(r.get("Uwagi")))}) or None,
            "aktualizacja": max((d for r in rows if (d := text(r.get("Data aktualizacji")))), default=None),
        },
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        rows = fetch(ACTION, SLUG, offline=args.offline)
        geocoder = Geocoder.load(districts, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    groups = group_rows(rows)
    pois, missed = [], []
    for (address, school), group in groups.items():
        poi = normalize(address, school, group, geocoder, districts)
        (pois.append(poi) if poi else missed.append(address))

    kept = merge_into(args.output, SLUG, pois)
    by_street = sum(p["properties"]["meta"]["geokodowanie"] == "street" for p in pois)
    print(
        f"OK: {len(pois)} szkół z boiskami → {args.output.relative_to(DATA_DIR.parent)} "
        f"(wierszy z API: {len(rows)}, szkół: {len(groups)}, tylko do ulicy: {by_street}, "
        f"nie znaleziono lub poza Warszawą: {len(missed)}, inne POI w pliku: {kept})"
    )
    for address in missed[:10]:
        print(f"  brak: {address}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
