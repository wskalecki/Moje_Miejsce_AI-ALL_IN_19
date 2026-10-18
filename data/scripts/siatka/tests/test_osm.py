import pytest
from shapely.geometry import Polygon

from siatka.sources.osm import element_rings


def pts(*coords):
    return [{"lon": x, "lat": y} for x, y in coords]


def test_multipolygon_outline_split_over_open_ways_is_one_ring():
    rel = {"type": "relation", "id": 1, "members": [
        {"type": "way", "role": "outer", "geometry": pts((0, 0), (4, 0), (4, 4))},
        {"type": "way", "role": "outer", "geometry": pts((4, 4), (0, 4), (0, 0))},
    ]}
    [ring] = element_rings(rel)
    assert Polygon(ring).area == pytest.approx(16)


def test_relation_without_members_is_an_error_not_an_empty_area():
    with pytest.raises(ValueError, match="out geom"):
        element_rings({"type": "relation", "id": 1613025, "tags": {"landuse": "forest"}})
