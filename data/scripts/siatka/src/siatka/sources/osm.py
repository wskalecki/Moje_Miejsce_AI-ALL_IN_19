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
    out = "out geom tags;" if geometry else "out center tags;"
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


def polygons(selectors: list[str], min_area_m2: float = 0) -> list[tuple[dict, list[list[tuple[float, float]]]]]:
    """Closed outer rings (lon, lat) of ways and multipolygon relations, with element tags."""
    from shapely.geometry import Polygon

    from siatka.geo import to_xy

    out = []
    for el in query(selectors, geometry=True):
        rings = []
        if el["type"] == "way" and el.get("geometry"):
            rings = [el["geometry"]]
        elif el["type"] == "relation":
            rings = [m["geometry"] for m in el.get("members", []) if m.get("role") == "outer" and m.get("geometry")]
        closed = []
        for ring in rings:
            pts = [(g["lon"], g["lat"]) for g in ring]
            if len(pts) >= 4 and pts[0] == pts[-1]:
                if min_area_m2:
                    xy = to_xy([p[0] for p in pts], [p[1] for p in pts])
                    if Polygon(xy).area < min_area_m2:
                        continue
                closed.append(pts)
        if closed:
            out.append((el, closed))
    return out
