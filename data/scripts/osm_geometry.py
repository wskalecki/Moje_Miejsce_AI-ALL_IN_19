"""Area polygons from Overpass `out geom;` elements (OpenStreetMap, ODbL).

Big OSM areas (forests, parks) are multipolygon relations: the outline is often drawn as several
open ways and clearings are `inner` rings, so a relation is stitched into polygons with its holes
cut out. A relation without members means the query asked for `out geom tags;`, which drops them;
that silently removed every large forest once, so it is an error here.

The siatka ETL (data/scripts/siatka/src/siatka/sources/osm.py) assembles rings the same way.
"""

from __future__ import annotations

import json
from pathlib import Path

import shapely
from shapely.geometry import LineString, Polygon
from shapely.ops import linemerge, polygonize


GREEN_TAGS = (("leisure", "park"), ("landuse", "forest"), ("natural", "wood"))


def find_green_cache(osm_dir: Path) -> Path:
    """siatka's Overpass cache of parks and forests (all three GREEN_TAGS present); the newest
    by its .meta.json fetched_at when the query was downloaded more than once."""
    found = []
    for p in osm_dir.glob("*.json"):
        if p.name.endswith(".meta.json") or p.stat().st_size < 1_000_000:
            continue
        tags = {(k, e.get("tags", {}).get(k)) for e in json.loads(p.read_text())["elements"] for k, _ in GREEN_TAGS}
        if all(t in tags for t in GREEN_TAGS):
            meta = p.with_suffix(".meta.json")
            found.append((json.loads(meta.read_text()).get("fetched_at", "") if meta.exists() else "", p))
    if not found:
        raise SystemExit(f"OSM parks/forests cache not found in {osm_dir} (run the siatka ETL)")
    return max(found)[1]


def _coords(geometry: list[dict]) -> list[tuple[float, float]]:
    return [(g["lon"], g["lat"]) for g in geometry]


def _ring_area(members: list[dict], role: str):
    lines = [LineString(_coords(m["geometry"])) for m in members
             if m.get("role") == role and len(m.get("geometry") or []) >= 2]
    if not lines:
        return None
    return shapely.union_all(list(polygonize(linemerge(lines))))


def element_polygons(el: dict) -> list[Polygon]:
    """Polygons (lon, lat) of a closed way or a multipolygon relation; [] for anything else."""
    if el["type"] == "way":
        pts = _coords(el.get("geometry") or [])
        if len(pts) < 4 or pts[0] != pts[-1]:
            return []
        geom = shapely.make_valid(Polygon(pts))
    elif el["type"] == "relation":
        if "members" not in el:
            raise ValueError(f"relation r{el['id']} has no members: the Overpass query must use `out geom;`, "
                             "not `out geom tags;` (which drops relation members)")
        outer = _ring_area(el["members"], "outer")
        if outer is None or outer.is_empty:
            return []
        inner = _ring_area(el["members"], "inner")
        geom = shapely.make_valid(outer if inner is None else outer.difference(inner))
    else:
        return []
    parts = getattr(geom, "geoms", [geom])
    return [p for p in parts if isinstance(p, Polygon) and not p.is_empty]
