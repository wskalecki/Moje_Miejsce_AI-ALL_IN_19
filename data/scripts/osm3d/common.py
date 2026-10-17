"""Shared constants and helpers for the OSM 3D pipeline (data/scripts/osm3d)."""

from __future__ import annotations

import json
import os
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "osm3d"  # gitignored cache (PBF, extracts, GTFS)
OUT_ROOT = REPO / "application" / "public" / "data" / "3d"
BOUNDARIES = REPO / "data" / "boundaries" / "warszawa_osiedla.geojson"
POI_DIR = REPO / "data" / "poi"

# Featured MSI areas (after the real-data ranking, 2026-10-17 evening). Override with
# OSM3D_AREAS=powisle,saska-kepa to build other areas.
FEATURED_AREAS = [a for a in os.environ.get("OSM3D_AREAS", "muranow,stare-bielany,natolin").split(",") if a]
AREA_BUFFER_M = 600

# Metric CRS for buffers/areas/distances (PUWG 1992).
TO_M = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True).transform
TO_WGS = Transformer.from_crs("EPSG:2180", "EPSG:4326", always_xy=True).transform


def to_m(geom):
    return transform(TO_M, geom)


def to_wgs(geom):
    return transform(TO_WGS, geom)


def featured_zones() -> list[dict]:
    """MSI polygon + 600 m buffer (WGS84 and metric) for each featured area."""
    fc = json.loads(BOUNDARIES.read_text())
    out = []
    for area_id in FEATURED_AREAS:
        f = next((x for x in fc["features"] if x["properties"]["id"] == area_id), None)
        if f is None:
            raise SystemExit(f"MSI area {area_id} not found in {BOUNDARIES}")
        area_m = to_m(shape(f["geometry"]))
        zone_m = area_m.buffer(AREA_BUFFER_M)
        zone = to_wgs(zone_m)
        out.append({"id": area_id, "name": f["properties"]["name"], "area_m": area_m,
                    "zone_m": zone_m, "zone": zone, "bbox": zone.bounds})
    return out


def round_coords(obj, digits: int = 6):
    """Round nested coordinate lists (GeoJSON `coordinates`)."""
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(obj[0], digits), round(obj[1], digits)]
        return [round_coords(x, digits) for x in obj]
    return obj


def dump_geojson(path: Path, features: list[dict]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps({"type": "FeatureCollection", "features": features},
                      ensure_ascii=False, separators=(",", ":"))
    path.write_text(text)
    return len(text.encode())
