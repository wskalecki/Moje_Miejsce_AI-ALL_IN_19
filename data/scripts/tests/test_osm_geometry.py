"""Polygons from Overpass `out geom;` elements (data/scripts/osm_geometry.py).

Run from the repo root:
    uv run --with pytest --with shapely pytest data/scripts/tests/test_osm_geometry.py -q
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from osm_geometry import element_polygons  # noqa: E402


def pts(*coords):
    return [{"lon": x, "lat": y} for x, y in coords]


def test_closed_way_is_a_polygon():
    way = {"type": "way", "id": 1, "geometry": pts((0, 0), (2, 0), (2, 1), (0, 1), (0, 0))}
    [poly] = element_polygons(way)
    assert poly.area == pytest.approx(2)


def test_open_way_is_not_an_area():
    way = {"type": "way", "id": 2, "geometry": pts((0, 0), (2, 0), (2, 1))}
    assert element_polygons(way) == []


def test_outer_ring_split_across_member_ways_is_stitched():
    # a 4 x 4 forest whose outline is drawn as two open ways (common for big OSM multipolygons)
    rel = {"type": "relation", "id": 3, "members": [
        {"type": "way", "role": "outer", "geometry": pts((0, 0), (4, 0), (4, 4))},
        {"type": "way", "role": "outer", "geometry": pts((4, 4), (0, 4), (0, 0))},
    ]}
    [poly] = element_polygons(rel)
    assert poly.area == pytest.approx(16)


def test_inner_ring_is_a_hole():
    rel = {"type": "relation", "id": 4, "members": [
        {"type": "way", "role": "outer", "geometry": pts((0, 0), (4, 0), (4, 4), (0, 4), (0, 0))},
        {"type": "way", "role": "inner", "geometry": pts((1, 1), (2, 1), (2, 2), (1, 2), (1, 1))},
    ]}
    [poly] = element_polygons(rel)
    assert poly.area == pytest.approx(15)


def test_relation_without_members_fails_loudly():
    # what `out geom tags;` returns: tags and bounds only, the forest silently disappeared
    rel = {"type": "relation", "id": 1613025, "tags": {"landuse": "forest", "name": "Las Bemowo"}, "bounds": {}}
    with pytest.raises(ValueError, match="out geom"):
        element_polygons(rel)
