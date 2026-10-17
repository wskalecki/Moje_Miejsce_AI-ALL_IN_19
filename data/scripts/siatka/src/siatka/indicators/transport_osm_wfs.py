"""Rail transit: metro entrances (city WFS) and tram stops (OSM). Bus/tram stops from the
city API live in transport_um.py."""

from __future__ import annotations

from siatka.indicator import CountWithin, NearestDistance
from siatka.model import dataset
from siatka.sources import city_wfs, osm


@dataset("wfs_metro_entrances", city_wfs.source("wfs:METRO_WEJSCIA"))
def metro_entrances():
    return city_wfs.point_pois("wfs:METRO_WEJSCIA", source_key="wfs_metro", category="transit", subtype="metro_station")


@dataset("osm_tram_stops", osm.OSM_SOURCE)
def tram_stops():
    return osm.pois(['["railway"="tram_stop"]'], source_key="osm", category="transit", subtype="tram_stop")


INDICATORS = [
    NearestDistance(
        key="metro_dist_m",
        label="Najbliższe wejście do metra",
        category="transport",
        good=500,
        bad=4000,
        datasets=("wfs_metro_entrances",),
    ),
    CountWithin(
        key="tram_stops_1km",
        label="Przystanki tramwajowe w promieniu 1 km",
        category="transport",
        good=6,
        bad=0,
        radius=1000,
        datasets=("osm_tram_stops",),
    ),
]
