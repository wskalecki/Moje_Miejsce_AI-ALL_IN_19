#!/usr/bin/env python3
"""Basic validation for grid, metrics, POI, and manifest."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"

PERSONAS = ("kasia", "marek", "ania_tomek")
POI_CATEGORIES = {
    "transit",
    "education",
    "sport",
    "culture",
    "environment",
    "amenity",
    "work_pin",
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


def validate_metrics(path: Path, grid_ids: set[str], errors: list[str]) -> None:
    data = load_json(path)
    if data.get("schemaVersion") != 1:
        errors.append(f"{path}: schemaVersion must be 1")
    for persona in PERSONAS:
        if persona not in data.get("personas", []):
            errors.append(f"{path}: personas must include {persona}")
    cells = data.get("cells", {})
    for cid, cell in cells.items():
        if grid_ids and cid not in grid_ids:
            errors.append(f"{path}: unknown cell_id {cid}")
        scores = cell.get("scores", {})
        for p in PERSONAS:
            if p not in scores:
                errors.append(f"{path}: {cid} missing scores.{p}")
            elif scores[p] is not None and not isinstance(scores[p], (int, float)):
                errors.append(f"{path}: {cid} scores.{p} must be number or null")


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


def validate_manifest(path: Path, errors: list[str]) -> None:
    data = load_json(path)
    if data.get("schemaVersion") != 1:
        errors.append(f"{path}: schemaVersion must be 1")
    files = data.get("files", {})
    for key in ("grid", "cellMetrics"):
        rel = files.get(key)
        if not rel:
            errors.append(f"{path}: files.{key} missing")
            continue
        if not (DATA_DIR / rel).exists():
            errors.append(f"{path}: missing file {rel}")
    for key in (
        "localBuildings",
        "localRoads",
        "localGreen",
        "localWater",
        "poiBuildings",
    ):
        rel = files.get(key)
        if rel and not (DATA_DIR / rel).exists():
            errors.append(f"{path}: missing file {rel}")


def main() -> int:
    errors: list[str] = []
    manifest_path = DATA_DIR / "manifest.json"
    if not manifest_path.exists():
        errors.append("data/manifest.json not found")
    else:
        manifest = load_json(manifest_path)
        files = manifest.get("files", {})
        grid_rel = files.get("grid", "")
        grid_path = DATA_DIR / grid_rel if grid_rel else None
        grid_ids: set[str] = set()
        if grid_path and grid_path.exists():
            grid_ids = validate_grid(grid_path, errors)
        metrics_path = DATA_DIR / files.get("cellMetrics", "")
        if metrics_path.exists():
            validate_metrics(metrics_path, grid_ids, errors)
        for poi_rel in files.get("poi", []):
            poi_path = DATA_DIR / poi_rel
            if poi_path.exists():
                validate_poi(poi_path, errors)
        validate_manifest(manifest_path, errors)

    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1
    print("OK: data validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
