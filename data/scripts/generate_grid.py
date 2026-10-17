#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""Generate the Warsaw grid GeoJSON. Also provides assign_cell() for ETL.

Cells are CELL_SIZE_M squares in EPSG:2180 (Poland CS92), counted from
(ORIGIN_E, ORIGIN_N). Output coordinates are WGS84, as GeoJSON requires.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

from pyproj import Transformer

# Aligned with docs/data/grid-schema.md. Changing any of these changes every cell ID.
GRID_VERSION = 2
GRID_CRS = "EPSG:2180"
ORIGIN_E = 620_000
ORIGIN_N = 470_000
CELL_SIZE_M = 200

_TO_GRID = Transformer.from_crs("EPSG:4326", GRID_CRS, always_xy=True)
_TO_WGS84 = Transformer.from_crs(GRID_CRS, "EPSG:4326", always_xy=True)

# west, south, east, north in WGS84. Warsaw spans lon 20.852–21.271, lat 52.098–52.368
# (official district borders). Cell IDs depend only on the EPSG:2180 origin, not on this box.
WARSAW_BBOX = (20.85, 52.09, 21.28, 52.37)

DISTRICTS_PATH = Path(__file__).resolve().parents[1] / "boundaries" / "warszawa_dzielnice.geojson"

# Sample: small patch (Mokotów-ish)
SAMPLE_BBOX = (20.98, 52.18, 21.06, 52.24)


def cell_id(row: int, col: int) -> str:
    return f"cell_r{row:03d}_c{col:03d}"


def lon_lat_to_row_col(lon: float, lat: float) -> tuple[int, int]:
    e, n = _TO_GRID.transform(lon, lat)
    col = math.floor((e - ORIGIN_E) / CELL_SIZE_M)
    row = math.floor((n - ORIGIN_N) / CELL_SIZE_M)
    return row, col


def assign_cell(lon: float, lat: float) -> str:
    row, col = lon_lat_to_row_col(lon, lat)
    return cell_id(row, col)


def _cell_point(row: int, col: int, fx: float, fy: float) -> list[float]:
    """[lon, lat] of the point at fractions (fx, fy) of the cell, measured in the grid CRS."""
    e = ORIGIN_E + (col + fx) * CELL_SIZE_M
    n = ORIGIN_N + (row + fy) * CELL_SIZE_M
    lon, lat = _TO_WGS84.transform(e, n)
    return [round(lon, 7), round(lat, 7)]  # ~1 cm, keeps the city-wide file small


def cell_polygon(row: int, col: int) -> list[list[float]]:
    """Cell ring in WGS84. A square in EPSG:2180, so slightly rotated in lon/lat."""
    return [_cell_point(row, col, fx, fy) for fx, fy in ((0, 0), (1, 0), (1, 1), (0, 1), (0, 0))]


def cell_center(row: int, col: int) -> list[float]:
    return _cell_point(row, col, 0.5, 0.5)


def _point_in_ring(lon: float, lat: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _point_in_geometry(lon: float, lat: float, geometry: dict[str, Any]) -> bool:
    polygons = (
        [geometry["coordinates"]]
        if geometry["type"] == "Polygon"
        else geometry["coordinates"]
    )
    for rings in polygons:
        if _point_in_ring(lon, lat, rings[0]) and not any(
            _point_in_ring(lon, lat, hole) for hole in rings[1:]
        ):
            return True
    return False


def load_districts(path: Path = DISTRICTS_PATH) -> list[tuple[str, dict[str, Any]]]:
    """Official district polygons (WGS84). Empty list if the file is missing."""
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    return [(feat["properties"]["district"], feat["geometry"]) for feat in data["features"]]


def district_at(lon: float, lat: float, districts: list[tuple[str, dict[str, Any]]]) -> str | None:
    for name, geometry in districts:
        if _point_in_geometry(lon, lat, geometry):
            return name
    return None


def cell_district(row: int, col: int, districts: list[tuple[str, dict[str, Any]]]) -> str | None:
    """District of the cell center, or of the first sampled point inside Warsaw.

    Samples the center, corners and edge midpoints, so border cells that are
    only partly inside the city still get a district.
    """
    samples = [cell_center(row, col)] + [
        _cell_point(row, col, fx, fy)
        for fx in (0.02, 0.5, 0.98)
        for fy in (0.02, 0.5, 0.98)
        if (fx, fy) != (0.5, 0.5)
    ]
    for lon, lat in samples:
        name = district_at(lon, lat, districts)
        if name:
            return name
    return None


def generate_grid(
    west: float,
    south: float,
    east: float,
    north: float,
    warsaw_only: bool = False,
) -> dict[str, Any]:
    districts = load_districts()
    # A lon/lat bbox is not axis-aligned in EPSG:2180, so span all four corners.
    corners = [lon_lat_to_row_col(lon, lat) for lon in (west, east) for lat in (south, north)]
    min_row, max_row = min(r for r, _ in corners), max(r for r, _ in corners)
    min_col, max_col = min(c for _, c in corners), max(c for _, c in corners)

    features: list[dict[str, Any]] = []
    for row in range(min_row, max_row + 1):
        for col in range(min_col, max_col + 1):
            cid = cell_id(row, col)
            center = cell_center(row, col)
            # Skip cells whose center is outside bbox (clean edges)
            if not (west <= center[0] <= east and south <= center[1] <= north):
                continue
            district = cell_district(row, col, districts) if districts else None
            in_warsaw = district is not None if districts else None
            if warsaw_only and not in_warsaw:
                continue
            features.append(
                {
                    "type": "Feature",
                    "id": cid,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [cell_polygon(row, col)],
                    },
                    "properties": {
                        "id": cid,
                        "row": row,
                        "col": col,
                        "center": center,
                        "in_warsaw": in_warsaw,
                        "district": district,
                    },
                }
            )

    return {
        "type": "FeatureCollection",
        "metadata": {
            "gridVersion": GRID_VERSION,
            "crs": GRID_CRS,
            "cellSizeM": CELL_SIZE_M,
            "origin": [ORIGIN_E, ORIGIN_N],
            "districtsSource": "data/boundaries/warszawa_dzielnice.geojson" if districts else None,
        },
        "features": features,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Warsaw 1 km grid GeoJSON")
    parser.add_argument(
        "--bbox",
        nargs=4,
        type=float,
        metavar=("W", "S", "E", "N"),
        help="west south east north (default: full Warsaw)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        required=True,
        help="Output .geojson path",
    )
    parser.add_argument(
        "--warsaw-only",
        action="store_true",
        help="keep only cells that overlap Warsaw (needs data/boundaries/warszawa_dzielnice.geojson)",
    )
    args = parser.parse_args()
    bbox = tuple(args.bbox) if args.bbox else WARSAW_BBOX
    geojson = generate_grid(*bbox, warsaw_only=args.warsaw_only)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(geojson['features'])} cells to {args.output}")


if __name__ == "__main__":
    main()
