#!/usr/bin/env python3
"""Validation of the committed grid sample and POI files, plus the data catalog checks."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from data_catalog import check_repo

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
POI_CATEGORIES = {
    "transit",
    "education",
    "sport",
    "culture",
    "environment",
    "amenity",
    "work_pin",
    "future",
}


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def validate_grid(path: Path, errors: list[str]) -> set[str]:
    ids: set[str] = set()
    data = load_json(path)
    if data.get("type") != "FeatureCollection":
        errors.append(f"{path}: not a FeatureCollection")
        return ids
    for feat in data.get("features", []):
        fid = feat.get("id") or feat.get("properties", {}).get("id")
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        if not fid:
            errors.append(f"{path}: feature missing id")
            continue
        if fid in ids:
            errors.append(f"{path}: duplicate id {fid}")
        ids.add(fid)
        if geom.get("type") != "Polygon":
            errors.append(f"{path}: {fid} geometry must be Polygon")
        for key in ("row", "col", "center"):
            if key not in props:
                errors.append(f"{path}: {fid} missing properties.{key}")
    return ids


def validate_poi(path: Path, errors: list[str]) -> None:
    data = load_json(path)
    if data.get("type") != "FeatureCollection":
        errors.append(f"{path}: not a FeatureCollection")
        return
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        for key in ("id", "category", "subtype", "source", "sourceId", "cell_id"):
            if key not in props:
                errors.append(f"{path}: feature missing {key}")
        if props.get("category") not in POI_CATEGORIES:
            errors.append(f"{path}: invalid category {props.get('category')}")
        if geom.get("type") != "Point":
            errors.append(f"{path}: geometry must be Point")


def main() -> int:
    errors: list[str] = []
    grid_sample = DATA_DIR / "samples" / "warsaw_grid_sample.geojson"
    if grid_sample.exists():
        validate_grid(grid_sample, errors)
    for poi_path in sorted((DATA_DIR / "poi_mikolaj").glob("*.geojson")):
        validate_poi(poi_path, errors)
    errors += check_repo(REPO_ROOT)

    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1
    print("OK: data validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
