import geopandas as gpd
from shapely.geometry import Point, box

from warsaw_noise import make_grid

CRS = "EPSG:2180"


def city(*bounds):
    return gpd.GeoDataFrame(geometry=[box(*bounds)], crs=CRS)


def test_grid_covers_city_exactly():
    grid = make_grid(city(1200, 300, 3700, 2100), cell_size=1000)

    assert len(grid) == 9
    assert grid.area.sum() == 2500 * 1800


def test_cells_are_aligned_to_full_cell_size_and_named_by_corner():
    grid = make_grid(city(1200, 300, 3700, 2100), cell_size=1000)

    inner = grid[grid.contains(Point(2500, 1500))].iloc[0]
    assert inner.cell_id == "1000m_E2000_N1000"
    assert tuple(inner.geometry.bounds) == (2000, 1000, 3000, 2000)

    corner = grid[grid.contains(Point(1500, 500))].iloc[0]
    assert corner.cell_id == "1000m_E1000_N0"
    assert tuple(corner.geometry.bounds) == (1200, 300, 2000, 1000)
