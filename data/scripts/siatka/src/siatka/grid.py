"""The 1 km grid, built by the team's generate_grid.py so cell IDs always match the contract."""

from __future__ import annotations

import importlib.util
import json
from dataclasses import dataclass
from functools import cached_property
from types import ModuleType

import numpy as np

from siatka.config import GRID_PATH, SCRIPTS_DIR
from siatka.geo import to_xy


def _load_generator() -> ModuleType:
    spec = importlib.util.spec_from_file_location("generate_grid", SCRIPTS_DIR / "generate_grid.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


gen = _load_generator()


@dataclass(frozen=True)
class Cell:
    id: str
    row: int
    col: int
    lon: float
    lat: float
    district: str | None


class Grid:
    """Warsaw cells (only those overlapping the city) with metric coordinates for distance math."""

    def __init__(self, geojson: dict):
        self.geojson = geojson
        self.cells = [
            Cell(
                id=f["id"],
                row=f["properties"]["row"],
                col=f["properties"]["col"],
                lon=f["properties"]["center"][0],
                lat=f["properties"]["center"][1],
                district=f["properties"].get("district"),
            )
            for f in geojson["features"]
        ]
        self.index = {c.id: i for i, c in enumerate(self.cells)}

    @classmethod
    def build(cls) -> Grid:
        return cls(gen.generate_grid(*gen.WARSAW_BBOX, warsaw_only=True))

    def save(self) -> None:
        GRID_PATH.parent.mkdir(parents=True, exist_ok=True)
        with GRID_PATH.open("w", encoding="utf-8") as f:
            json.dump(self.geojson, f, ensure_ascii=False)

    @property
    def ids(self) -> list[str]:
        return [c.id for c in self.cells]

    @cached_property
    def xy(self) -> np.ndarray:
        """Cell centers in EPSG:2180 metres, shape (n, 2)."""
        return to_xy([c.lon for c in self.cells], [c.lat for c in self.cells])

    def assign(self, lon: float, lat: float) -> str | None:
        """Cell ID for a point, or None if the point is outside the Warsaw grid."""
        cid = gen.assign_cell(lon, lat)
        return cid if cid in self.index else None
