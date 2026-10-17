"""Toilet ETL → POI schema (docs/data/poi-schema.md).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import json
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import etl_toalety  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()


def raw_toilet(lon, lat, **props):
    base = {"lokalizacja": "Pl. Defilad 1", "przewijak": 1, "dostepnosc": 0, "platnosc": 0, "godziny": "24h"}
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": base | props}


def test_toilet_follows_poi_schema_and_team_grid():
    poi = etl_toalety.normalize(raw_toilet(21.0060, 52.2318), DISTRICTS)
    p = poi["properties"]
    assert poi["id"] == p["id"] == f"toalety_{p['sourceId']}"
    assert (p["category"], p["subtype"], p["source"]) == ("amenity", "toilet", "toalety")
    assert p["cell_id"] == assign_cell(21.0060, 52.2318)
    assert poi["geometry"]["coordinates"] == [21.006, 52.2318]
    assert p["district"] == "Śródmieście"


def test_flags_become_booleans_and_unknown_is_null():
    p = etl_toalety.normalize(raw_toilet(21.0060, 52.2318, dostepnosc=None), DISTRICTS)["properties"]
    assert p["meta"]["przewijak"] is True
    assert p["meta"]["bez_barier"] is None
    assert p["meta"]["platna"] is False
    assert p["tags"] == ["przewijak", "bezplatna"]


def test_points_outside_warsaw_and_without_geometry_are_dropped():
    assert etl_toalety.normalize(raw_toilet(20.70, 52.20), DISTRICTS) is None  # Ożarów
    assert etl_toalety.normalize({"type": "Feature", "geometry": None, "properties": {}}, DISTRICTS) is None


def test_merge_replaces_only_toilets(tmp_path):
    out = tmp_path / "amenities.geojson"
    other = {"type": "Feature", "geometry": {"type": "Point", "coordinates": [21, 52.2]},
             "properties": {"id": "x_1", "source": "parkingi"}}
    out.write_text(json.dumps({"type": "FeatureCollection", "features": [other]}), encoding="utf-8")
    toilet = etl_toalety.normalize(raw_toilet(21.0060, 52.2318), DISTRICTS)

    etl_toalety.merge_into(out, "toalety", [toilet])
    etl_toalety.merge_into(out, "toalety", [toilet])

    sources = [f["properties"]["source"] for f in json.loads(out.read_text())["features"]]
    assert sorted(sources) == ["parkingi", "toalety"]
