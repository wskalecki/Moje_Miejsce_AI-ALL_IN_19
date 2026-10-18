"""OpenStreetMap via the Overpass API (ODbL). Used where city data is missing or stale."""

from __future__ import annotations

import json

import requests

from siatka.config import WARSAW_QUERY_BBOX
from siatka.model import POI, Source
from siatka.sources.cache import fetch

ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)

OSM_SOURCE = Source(
    name="OpenStreetMap (Overpass API)",
    url="https://www.openstreetmap.org/copyright",
    license="ODbL 1.0 — © współtwórcy OpenStreetMap",
)


def _check(body: bytes) -> None:
    if b'"elements"' not in body[:2000]:
        raise ValueError(f"Overpass returned no elements: {body[:200]!r}")


def query(selectors: list[str], geometry: bool = False) -> list[dict]:
    """Run nwr selectors (e.g. '["amenity"="school"]') over Warsaw.

    Returns elements with a `center`, or with full `geometry` / `members` when geometry=True.
    """
    s, w, n, e = WARSAW_QUERY_BBOX
    bbox = f"({s},{w},{n},{e})"
    # `out geom;` (body verbosity): `out geom tags;` drops relation members, i.e. every multipolygon
    out = "out geom;" if geometry else "out center tags;"
    body = "[out:json][timeout:180];(" + "".join(f"nwr{sel}{bbox};" for sel in selectors) + ");" + out
    last_error: Exception | None = None
    for url in ENDPOINTS:
        try:
            raw, _ = fetch("osm", url, method="POST", data={"data": body}, ext="json", validate=_check)
            return json.loads(raw)["elements"]
        except (requests.RequestException, ValueError) as exc:  # ValueError: bad/empty body
            last_error = exc
    raise RuntimeError(f"Overpass failed for {selectors}: {last_error}")


def pois(
    selectors: list[str],
    *,
    source_key: str,
    category: str,
    subtype: str,
    keep=lambda tags: True,
) -> list[POI]:
    out = []
    for el in query(selectors):
        tags = el.get("tags", {})
        if not keep(tags):
            continue
        if "lat" in el:
            lat, lon = el["lat"], el["lon"]
        elif "center" in el:
            lat, lon = el["center"]["lat"], el["center"]["lon"]
        else:
            continue
        out.append(
            POI(
                source_key=source_key,
                source_id=f"{el['type'][0]}{el['id']}",
                category=category,
                subtype=subtype,
                lon=lon,
                lat=lat,
                name=tags.get("name"),
                meta={k: tags[k] for k in ("operator", "opening_hours", "isced:level") if k in tags},
            )
        )
    return out


def element_rings(el: dict) -> list[list[tuple[float, float]]]:
    """Outer rings (lon, lat) of a closed way or a multipolygon relation, holes cut out first.

    Relation outlines are often split over several open ways, so they are stitched; a relation
    without members (an `out geom tags;` response) is an error, not an empty area. Same logic as
    data/scripts/osm_geometry.py, which the build scripts use.
    """
    import shapely
    from shapely.geometry import LineString, Polygon
    from shapely.ops import linemerge, polygonize

    def coords(geometry):
        return [(g["lon"], g["lat"]) for g in geometry]

    def area(role):
        lines = [LineString(coords(m["geometry"])) for m in el["members"]
                 if m.get("role") == role and len(m.get("geometry") or []) >= 2]
        return shapely.union_all(list(polygonize(linemerge(lines)))) if lines else None

    if el["type"] == "way":
        pts = coords(el.get("geometry") or [])
        if len(pts) < 4 or pts[0] != pts[-1]:
            return []
        geom = shapely.make_valid(Polygon(pts))
    elif el["type"] == "relation":
        if "members" not in el:
            raise ValueError(f"relation r{el['id']} has no members: query with `out geom;`, not `out geom tags;`")
        outer, inner = area("outer"), area("inner")
        if outer is None or outer.is_empty:
            return []
        geom = shapely.make_valid(outer if inner is None else outer.difference(inner))
    else:
        return []
    return [list(p.exterior.coords) for p in getattr(geom, "geoms", [geom]) if isinstance(p, Polygon) and not p.is_empty]


def polygons(selectors: list[str], min_area_m2: float = 0) -> list[tuple[dict, list[list[tuple[float, float]]]]]:
    """Outer rings (lon, lat) of ways and multipolygon relations, with element tags."""
    from shapely.geometry import Polygon

    from siatka.geo import to_xy

    out = []
    for el in query(selectors, geometry=True):
        rings = []
        for pts in element_rings(el):
            if min_area_m2 and Polygon(to_xy([p[0] for p in pts], [p[1] for p in pts])).area < min_area_m2:
                continue
            rings.append(pts)
        if rings:
            out.append((el, rings))
    return out
