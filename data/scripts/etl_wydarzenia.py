#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: city events calendar → data/poi_mikolaj/culture.geojson (docs/data/poi-schema.md).

Catalog slug: `kalendarz-wydarzen` (API action `get_bmm_kalendarz_wydarzen`),
licence CC BY — Urząd m.st. Warszawy.

One POI per event venue point (`map.features`); events without a point are skipped.
Dates arrive as `2027-01-29T19:00:00+01` and are written as full ISO 8601.

    uv run data/scripts/etl_wydarzenia.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_wydarzenia.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import POI_DIR, Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "kalendarz-wydarzen"
ACTION = "bmm_kalendarz_wydarzen"
OUT_PATH = POI_DIR / "culture.geojson"
MAX_OCCURRENCES = 20

_SHORT_OFFSET = re.compile(r"([+-]\d{2})$")


def iso(value: str | None) -> str | None:
    """'2027-01-29T19:00:00+01' → '2027-01-29T19:00:00+01:00'; invalid → None."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(_SHORT_OFFSET.sub(r"\1:00", value.strip())).isoformat()
    except ValueError:
        return None


def occurrences(event: dict[str, Any]) -> list[dict[str, str | None]]:
    out = []
    for occ in event.get("occurrence") or []:
        start = iso(occ.get("from"))
        if start:
            out.append({"od": start, "do": iso(occ.get("to")) or start})
    return sorted(out, key=lambda o: o["od"])


def normalize(event: dict[str, Any], districts: Districts) -> list[dict[str, Any]]:
    url = event.get("url")
    points = [
        f for f in (event.get("map") or {}).get("features") or []
        if (f.get("geometry") or {}).get("type") == "Point"
    ]
    if not url or not points:
        return []
    base_id = hashlib.sha1(url.encode()).hexdigest()[:12]
    dates = occurrences(event)
    categories = [c["name"] for c in event.get("category") or [] if c.get("name")]
    pois = []
    for i, f in enumerate(points):
        lon, lat = (float(c) for c in f["geometry"]["coordinates"][:2])
        street = f.get("properties") or {}
        address = " ".join(x for x in (street.get("shortStreetName"), street.get("streetNumber")) if x)
        poi = point_feature(
            lon,
            lat,
            source=SLUG,
            source_id=base_id if len(points) == 1 else f"{base_id}_{i}",
            category="culture",
            subtype="event",
            name=event.get("title"),
            districts=districts,
            tags=categories,
            meta={
                "url": url,
                "miejsce": (event.get("address") or [{}])[0].get("name"),
                "adres": address or None,
                "pierwszy_termin": dates[0]["od"] if dates else None,
                "ostatni_termin": max(o["do"] for o in dates) if dates else None,
                "liczba_terminow": len(dates),
                "terminy": dates[:MAX_OCCURRENCES],
            },
        )
        if poi:
            pois.append(poi)
    return pois


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        events = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    pois, seen, skipped = [], set(), 0
    for ev in events:
        found = normalize(ev, districts)
        skipped += not found
        for poi in found:
            if poi["id"] not in seen:
                seen.add(poi["id"])
                pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    print(
        f"OK: {len(pois)} punktów wydarzeń → {args.output.relative_to(DATA_DIR.parent)} "
        f"(wydarzeń z API: {len(events)}, pominięte bez punktu lub poza Warszawą: {skipped}, "
        f"inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
