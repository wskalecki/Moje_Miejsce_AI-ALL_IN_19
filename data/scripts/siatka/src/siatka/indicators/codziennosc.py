"""Everyday life: shops, playgrounds, pharmacies, clinics. OSM (city layers are from 2017)."""

from __future__ import annotations

from siatka.indicator import CountWithin, NearestDistance
from siatka.model import dataset
from siatka.sources import osm


@dataset("osm_supermarket", osm.OSM_SOURCE)
def supermarkets():
    return osm.pois(['["shop"="supermarket"]'], source_key="osm", category="amenity", subtype="supermarket")


@dataset("osm_playground", osm.OSM_SOURCE)
def playgrounds():
    return osm.pois(['["leisure"="playground"]'], source_key="osm", category="amenity", subtype="playground")


@dataset("osm_pharmacy", osm.OSM_SOURCE)
def pharmacies():
    return osm.pois(['["amenity"="pharmacy"]'], source_key="osm", category="amenity", subtype="pharmacy")


@dataset("osm_clinic", osm.OSM_SOURCE)
def clinics():
    return osm.pois(
        ['["amenity"="clinic"]', '["amenity"="doctors"]'], source_key="osm", category="amenity", subtype="clinic"
    )


INDICATORS = [
    NearestDistance(
        key="supermarket_dist_m",
        label="Najbliższy supermarket",
        category="codziennosc",
        good=400,
        bad=2000,
        datasets=("osm_supermarket",),
    ),
    CountWithin(
        key="playgrounds_1km",
        label="Place zabaw w promieniu 1 km",
        category="codziennosc",
        good=10,
        bad=0,
        radius=1000,
        datasets=("osm_playground",),
    ),
    NearestDistance(
        key="pharmacy_dist_m",
        label="Najbliższa apteka",
        category="zdrowie",
        good=300,
        bad=1500,
        datasets=("osm_pharmacy",),
    ),
    NearestDistance(
        key="clinic_dist_m",
        label="Najbliższa przychodnia",
        category="zdrowie",
        good=500,
        bad=2500,
        datasets=("osm_clinic",),
    ),
]
