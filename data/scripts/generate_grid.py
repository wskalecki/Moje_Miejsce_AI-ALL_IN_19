#!/usr/bin/env python3
"""Generate ~1 km grid GeoJSON for Warsaw. Also provides assign_cell() for POI ETL."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

# Aligned with docs/data/grid-schema.md
GRID_ORIGIN_LON = 20.85
GRID_ORIGIN_LAT = 52.10
STEP_LAT = 0.009
STEP_LON = 0.014

# west, south, east, north. Warsaw spans lon 20.852–21.271, lat 52.098–52.368
# (official district borders). The south edge stays at the grid origin so that
# existing cell IDs do not change; this drops a ~200 m sliver of southern Wilanów.
WARSAW_BBOX = (20.85, 52.10, 21.28, 52.37)

DISTRICTS_PATH = Path(__file__).resolve().parents[1] / "boundaries" / "warszawa_dzielnice.geojson"

# Sample: small patch (Mokotów-ish)
SAMPLE_BBOX = (20.98, 52.18, 21.06, 52.24)


def cell_id(row: int, col: int) -> str:
    return f"cell_r{row:03d}_c{col:03d}"


def lon_lat_to_row_col(lon: float, lat: float) -> tuple[int, int]:
    col = math.floor((lon - GRID_ORIGIN_LON) / STEP_LON)
    row = math.floor((lat - GRID_ORIGIN_LAT) / STEP_LAT)
    return row, col


def assign_cell(lon: float, lat: float) -> str:
    row, col = lon_lat_to_row_col(lon, lat)
    return cell_id(row, col)


def cell_polygon(row: int, col: int) -> list[list[float]]:
    west = GRID_ORIGIN_LON + col * STEP_LON
    south = GRID_ORIGIN_LAT + row * STEP_LAT
    east = west + STEP_LON
    north = south + STEP_LAT
    ring = [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
    ]
    return ring


def cell_center(row: int, col: int) -> list[float]:
    west = GRID_ORIGIN_LON + col * STEP_LON
    south = GRID_ORIGIN_LAT + row * STEP_LAT
    return [west + STEP_LON / 2, south + STEP_LAT / 2]


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
    west = GRID_ORIGIN_LON + col * STEP_LON
    south = GRID_ORIGIN_LAT + row * STEP_LAT
    samples = [cell_center(row, col)] + [
        [west + fx * STEP_LON, south + fy * STEP_LAT]
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
    min_row, min_col = lon_lat_to_row_col(west, south)
    max_row, max_col = lon_lat_to_row_col(east, north)

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
            "gridVersion": 1,
            "cellSizeApproxM": 1000,
            "origin": [GRID_ORIGIN_LON, GRID_ORIGIN_LAT],
            "step": [STEP_LON, STEP_LAT],
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
