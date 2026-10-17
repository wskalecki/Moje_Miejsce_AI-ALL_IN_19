"""Stops ETL → POI schema (docs/data/poi-schema.md).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_przystanki  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()


def raw_stop(lat="52.231426", lon="21.006000", **over):
    values = {"zespol": "7002", "slupek": "01", "nazwa_zespolu": "Centrum", "id_ulicy": "1913",
              "szer_geo": lat, "dlug_geo": lon} | over
    return {"values": [{"key": k, "value": v} for k, v in values.items()]}


def test_stop_post_follows_poi_schema_and_team_grid():
    poi = etl_przystanki.normalize(raw_stop(), DISTRICTS)
    p = poi["properties"]
    assert poi["id"] == p["id"] == "lokalizacja-przystanow-komunikacji-miejskiej_700201"
    assert (p["category"], p["subtype"], p["sourceId"]) == ("transit", "stop", "700201")
    assert p["name"] == "Centrum 01"
    assert p["cell_id"] == assign_cell(21.006, 52.231426)
    assert poi["geometry"]["coordinates"] == [21.006, 52.231426]  # strings → [lon, lat] floats
    assert p["district"] == "Śródmieście"
    assert p["meta"]["zespol"] == "7002"


def test_bad_coordinates_and_outside_warsaw_are_dropped():
    assert etl_przystanki.normalize(raw_stop(lat=""), DISTRICTS) is None
    assert etl_przystanki.normalize(raw_stop(lat="52.205", lon="20.70"), DISTRICTS) is None  # Ożarów
    assert etl_przystanki.normalize(raw_stop(slupek=""), DISTRICTS) is None
