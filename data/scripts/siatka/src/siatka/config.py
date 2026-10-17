"""Paths and environment shared by the whole pipeline."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[5]
DATA_DIR = REPO_ROOT / "data"
SCRIPTS_DIR = DATA_DIR / "scripts"
RAW_DIR = DATA_DIR / "raw"
GRID_DIR = DATA_DIR / "grid"
POI_DIR = DATA_DIR / "poi"

GRID_PATH = GRID_DIR / "warsaw_grid_1km.geojson"
METRICS_PATH = GRID_DIR / "cell_metrics.json"
INDICATORS_PATH = GRID_DIR / "indicators.json"
MANIFEST_PATH = DATA_DIR / "manifest.json"
README_PATH = DATA_DIR / "README.md"

# Warsaw bbox with a small margin, used for OSM / WFS queries (south, west, north, east)
WARSAW_QUERY_BBOX = (52.09, 20.84, 52.38, 21.29)

load_dotenv(DATA_DIR / ".env")


def um_api_key() -> str | None:
    """Warsaw open data API key (same variable as scripts on the `mikolaj` branch)."""
    return os.environ.get("UM_WARSZAWA_API_KEY", "").strip() or None
