"""Education path 0–19 (koncept: 'ścieżka rodziny'). OSM — city WFS has only school districts."""

from __future__ import annotations

import re

from siatka.indicator import NearestDistance
from siatka.model import dataset
from siatka.sources import osm

PRIMARY = re.compile(r"podstawow|\bSP\s*\d", re.I)
SECONDARY = re.compile(r"liceum|technikum|\bLO\b", re.I)


@dataset("osm_kindergarten", osm.OSM_SOURCE)
def kindergartens():
    return osm.pois(['["amenity"="kindergarten"]'], source_key="osm", category="education", subtype="kindergarten")


@dataset("osm_school_primary", osm.OSM_SOURCE)
def primary_schools():
    return osm.pois(
        ['["amenity"="school"]'],
        source_key="osm",
        category="education",
        subtype="school",
        keep=lambda t: bool(PRIMARY.search(t.get("name", ""))) or "1" in t.get("isced:level", ""),
    )


@dataset("osm_school_secondary", osm.OSM_SOURCE)
def secondary_schools():
    return osm.pois(
        ['["amenity"="school"]'],
        source_key="osm",
        category="education",
        subtype="high_school",
        keep=lambda t: bool(SECONDARY.search(t.get("name", ""))),
    )


@dataset("osm_university", osm.OSM_SOURCE)
def universities():
    return osm.pois(['["amenity"="university"]'], source_key="osm", category="education", subtype="university")


INDICATORS = [
    NearestDistance(
        key="kindergarten_dist_m",
        label="Najbliższe przedszkole",
        category="edukacja",
        good=400,
        bad=2000,
        datasets=("osm_kindergarten",),
        description="Odległość od środka kwadratu do najbliższego przedszkola.",
    ),
    NearestDistance(
        key="school_dist_m",
        label="Najbliższa szkoła podstawowa",
        category="edukacja",
        good=500,
        bad=2500,
        datasets=("osm_school_primary",),
    ),
    NearestDistance(
        key="highschool_dist_m",
        label="Najbliższe liceum lub technikum",
        category="edukacja",
        good=1000,
        bad=5000,
        datasets=("osm_school_secondary",),
    ),
    NearestDistance(
        key="university_dist_m",
        label="Najbliższa uczelnia",
        category="edukacja",
        good=1500,
        bad=8000,
        datasets=("osm_university",),
    ),
]
