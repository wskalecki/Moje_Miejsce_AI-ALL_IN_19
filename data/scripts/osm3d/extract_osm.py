#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["osmium>=4.0", "shapely>=2.1", "pyproj>=3.6"]
# ///
"""OSM extract → data/raw/osm3d/<msiId>.osm.geojson for each featured area (cache).

Source: Geofabrik `mazowieckie-latest.osm.pbf` (daily OSM snapshot, ODbL). We use the
PBF instead of Overpass because overpass-api.de refused connections on 2026-10-17
(rate limit while other team jobs were running) and its mirrors returned 500/504;
the selection below mirrors the Overpass query we would send:

  building=*  (ways + multipolygons)          → buildings
  highway=motorway..living_street (+ _link)   → roads
  amenity=school|kindergarten|university|college|hospital|clinic (areas) → campuses
  leisure=park|garden, natural=water (areas)  → green / water

Each output feature keeps all OSM tags plus `@type` (way|relation) and `@id`.

Run: uv run data/scripts/osm3d/extract_osm.py [--pbf path]   (downloads the PBF if missing)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

import osmium
from shapely.geometry import box, shape

sys.path.insert(0, str(Path(__file__).parent))
from common import RAW_DIR, featured_zones  # noqa: E402

PBF_URL = "https://download.geofabrik.de/europe/poland/mazowieckie-latest.osm.pbf"
HIGHWAYS = {
    "motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
    "secondary", "secondary_link", "tertiary", "tertiary_link", "residential",
    "living_street", "unclassified",
}
CAMPUS = {"school", "kindergarten", "university", "college", "hospital", "clinic"}


def wanted_area(tags) -> bool:
    return ("building" in tags or tags.get("amenity") in CAMPUS
            or tags.get("leisure") in ("park", "garden") or tags.get("natural") == "water")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pbf", type=Path, default=RAW_DIR / "mazowieckie-latest.osm.pbf")
    args = ap.parse_args()
    if not args.pbf.exists():
        print(f"downloading {PBF_URL} …")
        args.pbf.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(PBF_URL, args.pbf)

    zones = featured_zones()
    boxes = [box(*z["bbox"]) for z in zones]
    w = min(b.bounds[0] for b in boxes); s = min(b.bounds[1] for b in boxes)
    e = max(b.bounds[2] for b in boxes); n = max(b.bounds[3] for b in boxes)
    buckets: dict[str, list[dict]] = {z["id"]: [] for z in zones}
    gj = osmium.geom.GeoJSONFactory()

    def emit(geom_json: str, tags: dict, otype: str, oid: int) -> None:
        g = shape(json.loads(geom_json))
        for z, b in zip(zones, boxes):
            if g.intersects(b):
                buckets[z["id"]].append({
                    "type": "Feature", "geometry": json.loads(geom_json),
                    "properties": {**tags, "@type": otype, "@id": oid}})

    t0 = time.time()
    fp = (osmium.FileProcessor(str(args.pbf))
          .with_locations()
          .with_areas(osmium.filter.KeyFilter("building", "amenity", "leisure", "natural"))
          .with_filter(osmium.filter.KeyFilter("building", "highway", "amenity", "leisure", "natural")))
    for obj in fp:
        if obj.is_area():
            tags = dict(obj.tags)
            if not wanted_area(tags):
                continue
            # cheap bbox pre-check on the first outer ring node
            try:
                ring = next(iter(obj.outer_rings()))
                loc = ring[0].location
            except (StopIteration, osmium.InvalidLocationError):
                continue
            if not (w - 0.02 <= loc.lon <= e + 0.02 and s - 0.02 <= loc.lat <= n + 0.02):
                continue
            try:
                geom = gj.create_multipolygon(obj)
            except (RuntimeError, osmium.InvalidLocationError):
                continue
            emit(geom, tags, "way" if obj.from_way() else "relation", obj.orig_id())
        elif obj.is_way():
            hw = obj.tags.get("highway")
            if hw not in HIGHWAYS:
                continue
            try:
                lons = [nd.location.lon for nd in obj.nodes]
                lats = [nd.location.lat for nd in obj.nodes]
            except osmium.InvalidLocationError:
                continue
            if max(lons) < w or min(lons) > e or max(lats) < s or min(lats) > n:
                continue
            try:
                geom = gj.create_linestring(obj)
            except (RuntimeError, osmium.InvalidLocationError):
                continue
            emit(geom, dict(obj.tags), "way", obj.id)

    print(f"scanned PBF in {time.time() - t0:.0f} s")
    for zid, feats in buckets.items():
        out = RAW_DIR / f"{zid}.osm.geojson"
        out.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False))
        print(f"{zid}: {len(feats)} features → {out} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
