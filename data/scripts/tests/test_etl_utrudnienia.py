"""Road works ETL → lines with crossed grid cells.

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_utrudnienia  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()


def works(*parts, **over):
    geo = [[{"geomType": 1 if len(p) > 1 else 0, "latlngs": [{"lat": lat, "lng": lng} for lng, lat in p]}
            for p in parts]]
    base = {"id": 13527, "name": "Przebudują ulicę Dyrekcyjną", "geo": geo, "detour_type": ["Zamknięcie ulicy"],
            "start_date": "2026-10-19 06:00:00", "end_date": "", "streets": ["Dyrekcyjna"],
            "content": ["Zdanie 1.", "Zdanie 2."]}
    return base | over


def test_line_lists_every_crossed_cell():
    start, end = (20.888625, 52.198428), (20.894279, 52.200242)  # ~430 m, crosses several grid cells
    f = etl_utrudnienia.normalize(works([start, end]), DISTRICTS)
    p = f["properties"]
    assert f["geometry"] == {"type": "LineString", "coordinates": [list(start), list(end)]}
    assert assign_cell(*start) in p["cell_ids"] and assign_cell(*end) in p["cell_ids"]
    assert len(p["cell_ids"]) >= 3
    assert p["districts"] == ["Ursus"]
    assert p["id"] == "utrudnienia-w-ruchu-drogowym_13527"
    assert p["meta"]["od"] == "2026-10-19T06:00:00"
    assert p["meta"]["do"] is None
    assert p["meta"]["opis"] == "Zdanie 1. Zdanie 2."


def test_single_vertex_parts_become_points():
    f = etl_utrudnienia.normalize(works([(21.0060, 52.2318)]), DISTRICTS)
    assert f["geometry"] == {"type": "Point", "coordinates": [21.006, 52.2318]}
    assert f["properties"]["cell_ids"] == [assign_cell(21.0060, 52.2318)]


def test_without_geometry_or_outside_warsaw_dropped():
    assert etl_utrudnienia.normalize(works(geo=[]), DISTRICTS) is None
    assert etl_utrudnienia.normalize(works([(20.70, 52.20), (20.71, 52.20)]), DISTRICTS) is None
