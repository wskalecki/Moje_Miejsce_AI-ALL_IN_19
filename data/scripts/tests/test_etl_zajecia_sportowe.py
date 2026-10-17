"""Sports classes ETL → POI schema (docs/data/poi-schema.md).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_zajecia_sportowe as etl  # noqa: E402
from geocode_address import Geocoder  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()
GEOCODER = Geocoder(
    [{"properties": {"NAZWA_ULICY": "ulica Michała Kajki", "NUMER_PORZADKOWY": "80/82"},
      "geometry": {"type": "Point", "coordinates": [21.1650, 52.2380]}}],
    DISTRICTS,
)


def sports_class(**over):
    base = {"title": "Fitness", "url": "https://sport.um.warszawa.pl/-/fitness-36",
            "category": [{"id": "c20", "name": "Fitness"}, {"id": "c0"}],
            "day": [{}, {"id": "monday", "name": "Poniedziałek"}], "time": "19:00",
            "dedicated": [{"id": "v1", "name": "Kobiety"}], "localization": [{"id": "wawer", "name": "Wawer"}],
            "address": [{"name": "SP 218", "street": "Michała Kajki 80/82"}],
            "map": {"features": [{"geometry": {"type": "Point", "coordinates": [21.0270, 52.1580]}}]}}
    return base | over


def test_map_point_wins_and_schema_fields():
    [poi] = etl.normalize(sports_class(), GEOCODER, DISTRICTS)
    p = poi["properties"]
    assert (p["category"], p["subtype"], p["name"]) == ("sport", "sports_class", "Fitness")
    assert p["meta"]["lokalizacja"] == "mapa"
    assert p["cell_id"] == assign_cell(21.0270, 52.1580)
    assert p["tags"] == ["Fitness"]
    assert p["meta"]["dni"] == ["monday"]
    assert p["meta"]["terminy"] is None


def test_address_is_geocoded_when_no_map_point():
    [poi] = etl.normalize(sports_class(map=None), GEOCODER, DISTRICTS)
    assert poi["properties"]["meta"]["lokalizacja"] == "adres_address"
    assert poi["geometry"]["coordinates"] == [21.165, 52.238]


def test_district_only_class_is_skipped():
    assert etl.normalize(sports_class(map=None, address=None), GEOCODER, DISTRICTS) == []
