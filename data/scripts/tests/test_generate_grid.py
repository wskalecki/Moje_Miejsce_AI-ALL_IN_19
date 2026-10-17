"""Behaviour of the team grid (docs/data/grid-schema.md).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "generate_grid.py"
_spec = importlib.util.spec_from_file_location("generate_grid", SCRIPT)
grid = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(grid)

PALACE_OF_CULTURE = (21.0060, 52.2318)


def test_palace_of_culture_lands_in_its_200m_cell():
    assert grid.assign_cell(*PALACE_OF_CULTURE) == "cell_r084_c084"


def test_columns_grow_east_and_rows_grow_north():
    assert grid.assign_cell(21.0120, 52.2318) == "cell_r084_c086"
    assert grid.assign_cell(21.0060, 52.2354) == "cell_r086_c084"


AROUND_PALACE = (21.000, 52.228, 21.012, 52.236)  # west, south, east, north


def test_cells_are_200m_squares_aligned_to_the_origin():
    from pyproj import Transformer

    to_metres = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True)
    features = grid.generate_grid(*AROUND_PALACE)["features"]

    assert features
    for feature in features:
        es, ns = to_metres.transform(*zip(*feature["geometry"]["coordinates"][0]))
        # coordinates are rounded to 7 decimals, about 1 cm
        assert max(es) - min(es) == pytest.approx(200, abs=0.02)
        assert max(ns) - min(ns) == pytest.approx(200, abs=0.02)
        assert min(es) == pytest.approx(round(min(es) / 200) * 200, abs=0.02)
        assert min(ns) == pytest.approx(round(min(ns) / 200) * 200, abs=0.02)


def test_metadata_describes_the_metric_grid():
    metadata = grid.generate_grid(*AROUND_PALACE)["metadata"]

    assert metadata["gridVersion"] == 2
    assert metadata["crs"] == "EPSG:2180"
    assert metadata["cellSizeM"] == 200
    assert metadata["origin"] == [620000, 470000]


def test_every_cell_id_is_what_assign_cell_returns_at_its_centre():
    features = grid.generate_grid(*AROUND_PALACE)["features"]

    assert "cell_r084_c084" in {f["id"] for f in features}
    for feature in features:
        assert grid.assign_cell(*feature["properties"]["center"]) == feature["id"]


def by_id(geojson):
    return {f["id"]: f["properties"] for f in geojson["features"]}


def test_cell_takes_the_district_of_its_centre():
    cells = by_id(grid.generate_grid(*AROUND_PALACE))

    assert cells["cell_r084_c084"]["district"] == "Śródmieście"
    assert cells["cell_r084_c084"]["in_warsaw"] is True


# North-west border: cell_r153_c053 has its centre outside Warsaw but reaches
# into Białołęka; cell_r141_c048 lies wholly in Łomianki.
NORTH_WEST_BORDER = (20.895, 52.330, 20.930, 52.362)


def test_warsaw_only_keeps_border_cells_and_drops_cells_outside_the_city():
    cells = by_id(grid.generate_grid(*NORTH_WEST_BORDER, warsaw_only=True))

    assert cells["cell_r153_c053"]["district"] == "Białołęka"
    assert "cell_r141_c048" not in cells


def test_cells_outside_the_city_are_marked_when_kept():
    cells = by_id(grid.generate_grid(*NORTH_WEST_BORDER))

    assert cells["cell_r141_c048"]["in_warsaw"] is False
    assert cells["cell_r141_c048"]["district"] is None
