#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: public transport stops → data/poi_mikolaj/transit.geojson (docs/data/poi-schema.md).

Catalog slug: `lokalizacja-przystanow-komunikacji-miejskiej`
(API action `get_ztm_przystanki_komunikacji_miejskiej` — differs from the slug),
licence CC BY — Urząd m.st. Warszawy.

One POI per stop post (`zespol` + `slupek`, e.g. 4214/01), since posts of one stop
group can stand on different streets. The dataset has no mode (bus/tram/metro).

    uv run data/scripts/etl_przystanki.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_przystanki.py --offline  # rebuild from data/raw/{slug}/
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import POI_DIR, Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "lokalizacja-przystanow-komunikacji-miejskiej"
ACTION = "ztm_przystanki_komunikacji_miejskiej"
OUT_PATH = POI_DIR / "transit.geojson"


def record(row: dict[str, Any]) -> dict[str, str]:
    """API rows are `{"values": [{"key": …, "value": …}, …]}`."""
    return {kv["key"]: kv["value"] for kv in row.get("values", [])}


def normalize(row: dict[str, Any], districts: Districts) -> dict[str, Any] | None:
    r = record(row)
    group, post = (r.get("zespol") or "").strip(), (r.get("slupek") or "").strip()
    try:
        lat, lon = float(r["szer_geo"]), float(r["dlug_geo"])
    except (KeyError, TypeError, ValueError):
        return None
    if not group or not post:
        return None
    name = (r.get("nazwa_zespolu") or "").strip()
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=f"{group}{post}",
        category="transit",
        subtype="stop",
        name=f"{name} {post}" if name else None,
        districts=districts,
        meta={"zespol": group, "slupek": post, "nazwa_zespolu": name or None, "id_ulicy": r.get("id_ulicy") or None},
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    if not districts:
        print("UWAGA: brak data/boundaries/warszawa_dzielnice.geojson, district = null i brak filtra granic",
              file=sys.stderr)

    try:
        rows = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    pois, seen = [], set()
    for row in rows:
        poi = normalize(row, districts)
        if poi and poi["id"] not in seen:
            seen.add(poi["id"])
            pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    groups = len({p["properties"]["meta"]["zespol"] for p in pois})
    print(
        f"OK: {len(pois)} słupków ({groups} zespołów) → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(rows)}, odrzucone poza Warszawą/błędne/duplikaty: {len(rows) - len(pois)}, "
        f"inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
