"""Green space (OSM parks and forests) and culture (gastronomy OSM, libraries and
University of the Third Age from the city WFS)."""

from __future__ import annotations

from functools import lru_cache

from siatka.indicator import CountWithin, NearestDistance, NearestPolygonDistance
from siatka.model import POI, dataset
from siatka.sources import city_wfs, osm

GREEN_SELECTORS = ['["leisure"="park"]', '["landuse"="forest"]', '["natural"="wood"]']
MIN_GREEN_AREA_M2 = 10_000  # 1 ha — skip lawns and tiny tree patches


@lru_cache(maxsize=1)
def _green_polygons():
    return osm.polygons(GREEN_SELECTORS, min_area_m2=MIN_GREEN_AREA_M2)


@dataset("osm_parks", osm.OSM_SOURCE)
def parks():
    """Park/forest centroids for the map layer; the indicator uses full polygons."""
    out = []
    for el, rings in _green_polygons():
        ring = rings[0]
        tags = el.get("tags", {})
        out.append(
            POI(
                source_key="osm",
                source_id=f"{el['type'][0]}{el['id']}",
                category="environment",
                subtype="park" if tags.get("leisure") == "park" else "forest",
                lon=sum(p[0] for p in ring) / len(ring),
                lat=sum(p[1] for p in ring) / len(ring),
                name=tags.get("name"),
            )
        )
    return out


def _green_rings(ctx):
    ctx.pois("osm_parks")  # registers the dataset (source + freshness) for this run
    return [ring for _, rings in _green_polygons() for ring in rings]


@dataset("osm_gastronomy", osm.OSM_SOURCE)
def gastronomy():
    return osm.pois(
        ['["amenity"~"^(restaurant|cafe|bar|pub)$"]'], source_key="osm", category="culture", subtype="gastronomy"
    )


@dataset("wfs_libraries", city_wfs.source("ns92528565:BIBLIOTEKI"))
def libraries():
    return city_wfs.point_pois(
        "ns92528565:BIBLIOTEKI", source_key="wfs_biblioteki", category="culture", subtype="library", name_field="NAZWA"
    )


@dataset("wfs_utw", city_wfs.source("ns92528565:UNIWERSYTETY_TRZECIEGO_WIEKU"))
def universities_third_age():
    return city_wfs.point_pois(
        "ns92528565:UNIWERSYTETY_TRZECIEGO_WIEKU",
        source_key="wfs_utw",
        category="culture",
        subtype="utw",
        name_field="NAZWA",
    )


INDICATORS = [
    NearestPolygonDistance(
        key="park_dist_m",
        label="Najbliższy park lub las",
        category="srodowisko",
        good=200,
        bad=1500,
        datasets=("osm_parks",),
        polygons=_green_rings,
        description="Odległość do krawędzi parku lub lasu (min. 1 ha); 0 m, jeśli środek kwadratu leży w zieleni.",
    ),
    CountWithin(
        key="gastronomy_1km",
        label="Restauracje, kawiarnie i bary w promieniu 1 km",
        category="kultura",
        good=60,
        bad=2,
        radius=1000,
        datasets=("osm_gastronomy",),
    ),
    NearestDistance(
        key="library_dist_m",
        label="Najbliższa biblioteka",
        category="kultura",
        good=500,
        bad=3000,
        datasets=("wfs_libraries",),
    ),
    NearestDistance(
        key="utw_dist_m",
        label="Najbliższy Uniwersytet Trzeciego Wieku",
        category="kultura",
        good=1000,
        bad=5000,
        datasets=("wfs_utw",),
    ),
]
