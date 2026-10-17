import math

import geopandas as gpd
from shapely.geometry import box


def make_grid(boundary: gpd.GeoDataFrame, cell_size: int = 1000) -> gpd.GeoDataFrame:
    """Square grid aligned to multiples of `cell_size`, clipped to `boundary`."""
    minx, miny, maxx, maxy = boundary.total_bounds
    x0 = math.floor(minx / cell_size) * cell_size
    y0 = math.floor(miny / cell_size) * cell_size
    corners = [
        (x, y)
        for x in range(x0, math.ceil(maxx / cell_size) * cell_size, cell_size)
        for y in range(y0, math.ceil(maxy / cell_size) * cell_size, cell_size)
    ]
    grid = gpd.GeoDataFrame(
        {"cell_id": [f"{cell_size}m_E{x}_N{y}" for x, y in corners]},
        geometry=[box(x, y, x + cell_size, y + cell_size) for x, y in corners],
        crs=boundary.crs,
    )
    grid = grid.clip(boundary)
    return grid[grid.area > 0].reset_index(drop=True)
