#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: free city sports classes → data/poi_mikolaj/sport.geojson (docs/data/poi-schema.md).

Catalog slug: `zajecia-sportowe` (API action `get_bmm_zajecia_sportowe`), licence CC BY — Urząd m.st. Warszawy.

Location, best first: venue point from `map.features`; otherwise `address[].street`
geocoded with the city address points inside the class's district (`localization`);
classes with only a district are skipped. `meta.lokalizacja` says which was used.

    uv run data/scripts/etl_zajecia_sportowe.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_zajecia_sportowe.py --offline  # rebuild from data/raw/
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from geocode_address import Geocoder
from poi_common import POI_DIR, Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch

SLUG = "zajecia-sportowe"
ACTION = "bmm_zajecia_sportowe"
OUT_PATH = POI_DIR / "sport.geojson"


def names(items: list[dict[str, Any]] | None) -> list[str]:
    return [i["name"] for i in items or [] if i.get("name")]


def locations(cls: dict[str, Any], geocoder: Geocoder) -> list[tuple[float, float, str]]:
    points = [
        (float(f["geometry"]["coordinates"][0]), float(f["geometry"]["coordinates"][1]), "mapa")
        for f in (cls.get("map") or {}).get("features") or []
        if (f.get("geometry") or {}).get("type") == "Point"
    ]
    if points:
        return points
    district = next(iter(names(cls.get("localization"))), None)
    out = []
    for a in cls.get("address") or []:
        hit = geocoder.geocode(a.get("street") or "", district) if a.get("street") else None
        if hit:
            out.append((hit.lon, hit.lat, f"adres_{hit.precision}"))
    return out


def normalize(cls: dict[str, Any], geocoder: Geocoder, districts: Districts) -> list[dict[str, Any]]:
    url = cls.get("url")
    if not url:
        return []
    found = locations(cls, geocoder)
    base_id = hashlib.sha1(url.encode()).hexdigest()[:12]
    venue = (cls.get("address") or [{}])[0]
    pois = []
    for i, (lon, lat, how) in enumerate(found):
        poi = point_feature(
            lon,
            lat,
            source=SLUG,
            source_id=base_id if len(found) == 1 else f"{base_id}_{i}",
            category="sport",
            subtype="sports_class",
            name=cls.get("title"),
            districts=districts,
            tags=names(cls.get("category")),
            meta={
                "url": url,
                "miejsce": venue.get("name"),
                "adres": venue.get("street"),
                "lokalizacja": how,
                "dni": [d["id"] for d in cls.get("day") or [] if d.get("id")],
                "godzina": cls.get("time") or None,
                "terminy": sorted(cls.get("date") or []) or None,
                "dla_kogo": names(cls.get("dedicated")),
            },
        )
        if poi:
            pois.append(poi)
    return pois


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        classes = fetch(ACTION, SLUG, offline=args.offline)
        geocoder = Geocoder.load(districts, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    pois, seen, skipped = [], set(), 0
    for cls in classes:
        found = normalize(cls, geocoder, districts)
        skipped += not found
        for poi in found:
            if poi["id"] not in seen:
                seen.add(poi["id"])
                pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    how = {}
    for p in pois:
        how[p["properties"]["meta"]["lokalizacja"]] = how.get(p["properties"]["meta"]["lokalizacja"], 0) + 1
    print(
        f"OK: {len(pois)} punktów zajęć → {args.output.relative_to(DATA_DIR.parent)} "
        f"(zajęć z API: {len(classes)}, pominięte tylko z dzielnicą lub poza Warszawą: {skipped}, "
        f"źródło punktu: {how}, inne POI w pliku: {kept})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
