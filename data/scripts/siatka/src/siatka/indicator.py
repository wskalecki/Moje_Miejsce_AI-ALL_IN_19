"""Indicators: one metric per grid cell, with metadata for normalisation and the UI.

Adding data = declare a dataset (siatka.model.dataset) and one of the indicator
types below in a module under siatka/indicators/. Nothing else needs to change.
"""

from __future__ import annotations

import math
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Callable

import numpy as np

from siatka.geo import count_within, idw, nearest_distance, to_xy

if TYPE_CHECKING:
    from siatka.pipeline import Context

# UI groups (koncept-aplikacji.md: tryb warstw)
CATEGORIES = {
    "edukacja",
    "transport",
    "codziennosc",
    "zdrowie",
    "srodowisko",
    "sport",
    "kultura",
    "bezpieczenstwo",
    "finanse",
    "przyszlosc",
}

Values = dict[str, float | None]


@dataclass(kw_only=True)
class Indicator(ABC):
    key: str  # snake_case metric key in cell_metrics.json
    label: str  # Polish label for the panel
    category: str
    unit: str  # e.g. "m", "szt.", "zł/m²", "PIJP"
    good: float  # value that normalises to 100
    bad: float  # value that normalises to 0 (direction follows good vs bad)
    datasets: tuple[str, ...] = ()
    description: str = ""
    decimals: int = 0

    def __post_init__(self) -> None:
        if self.category not in CATEGORIES:
            raise ValueError(f"{self.key}: unknown category {self.category!r}")
        if self.good == self.bad:
            raise ValueError(f"{self.key}: good and bad thresholds must differ")

    @abstractmethod
    def compute(self, ctx: Context) -> Values: ...

    def normalise(self, value: float | None) -> int | None:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return None
        t = (value - self.bad) / (self.good - self.bad)
        return int(round(100 * min(1.0, max(0.0, t))))

    def metadata(self, ctx: Context) -> dict[str, Any]:
        return {
            "key": self.key,
            "label": self.label,
            "category": self.category,
            "unit": self.unit,
            "good": self.good,
            "bad": self.bad,
            "higherIsBetter": self.good > self.bad,
            "description": self.description,
            "sources": [ctx.source_info(k) for k in self.datasets],
        }

    def _finish(self, ctx: Context, arr: np.ndarray) -> Values:
        out: Values = {}
        for cid, v in zip(ctx.grid.ids, arr):
            out[cid] = None if v is None or np.isnan(v) else round(float(v), self.decimals)
            if self.decimals == 0 and out[cid] is not None:
                out[cid] = int(out[cid])
        return out


def _points(ctx: Context, dataset_keys: tuple[str, ...], where: Callable | None = None) -> np.ndarray:
    pois = [p for k in dataset_keys for p in ctx.pois(k) if where is None or where(p)]
    if not pois:
        return np.empty((0, 2))
    return to_xy([p.lon for p in pois], [p.lat for p in pois])


@dataclass(kw_only=True)
class NearestDistance(Indicator):
    """Metres from the cell center to the nearest POI of the given datasets."""

    unit: str = "m"
    where: Callable | None = None
    max_relevant: float = 10_000  # farther than this counts as missing context, not data

    def compute(self, ctx: Context) -> Values:
        pts = _points(ctx, self.datasets, self.where)
        if len(pts) == 0:
            return {cid: None for cid in ctx.grid.ids}
        d = nearest_distance(ctx.grid.xy, pts)
        return self._finish(ctx, np.minimum(d, self.max_relevant))


@dataclass(kw_only=True)
class CountWithin(Indicator):
    """Number of POIs within `radius` metres of the cell center."""

    unit: str = "szt."
    radius: float = 1000
    where: Callable | None = None
    distinct: bool = False  # count distinct source_id (e.g. one road works = many line vertices)

    def compute(self, ctx: Context) -> Values:
        if not any(ctx.pois(k) for k in self.datasets):
            return {cid: None for cid in ctx.grid.ids}
        if not self.distinct:
            pts = _points(ctx, self.datasets, self.where)
            return self._finish(ctx, count_within(ctx.grid.xy, pts, self.radius))
        pois = [p for k in self.datasets for p in ctx.pois(k) if self.where is None or self.where(p)]
        if not pois:
            return self._finish(ctx, np.zeros(len(ctx.grid.ids)))
        pts = to_xy([p.lon for p in pois], [p.lat for p in pois])
        _, groups = np.unique([p.source_id for p in pois], return_inverse=True)
        counts = np.zeros(len(ctx.grid.ids))
        for i, origin in enumerate(ctx.grid.xy):
            near = np.sqrt(((pts - origin) ** 2).sum(axis=1)) <= self.radius
            counts[i] = len(np.unique(groups[near]))
        return self._finish(ctx, counts)


@dataclass(kw_only=True)
class IdwValue(Indicator):
    """Inverse-distance-weighted value of a numeric POI attribute (e.g. air quality index)."""

    value_of: Callable = lambda p: None
    max_distance: float = 5000
    decimals: int = 1

    def compute(self, ctx: Context) -> Values:
        pois = [p for k in self.datasets for p in ctx.pois(k)]
        vals = [(p, self.value_of(p)) for p in pois]
        vals = [(p, v) for p, v in vals if v is not None]
        if not vals:
            return {cid: None for cid in ctx.grid.ids}
        pts = to_xy([p.lon for p, _ in vals], [p.lat for p, _ in vals])
        arr = idw(ctx.grid.xy, pts, np.array([v for _, v in vals], float), max_distance=self.max_distance)
        return self._finish(ctx, arr)


@dataclass(kw_only=True)
class DistrictValue(Indicator):
    """One value per district (e.g. median price, crime rate), copied to every cell in it."""

    values_by_district: Callable[[Context], dict[str, float]] = lambda ctx: {}

    def compute(self, ctx: Context) -> Values:
        by_district = self.values_by_district(ctx)
        arr = np.array(
            [by_district.get(c.district, np.nan) if c.district else np.nan for c in ctx.grid.cells],
            float,
        )
        return self._finish(ctx, arr)


@dataclass(kw_only=True)
class NearestPolygonDistance(Indicator):
    """Metres from the cell center to the nearest polygon edge (0 inside), e.g. parks.

    `polygons(ctx)` returns rings in (lon, lat); computed in EPSG:2180.
    """

    unit: str = "m"
    polygons: Callable = lambda ctx: []
    max_relevant: float = 10_000

    def compute(self, ctx: Context) -> Values:
        from shapely import STRtree, points
        from shapely.geometry import Polygon

        rings = self.polygons(ctx)
        if not rings:
            return {cid: None for cid in ctx.grid.ids}
        geoms = [Polygon(to_xy([p[0] for p in r], [p[1] for p in r])) for r in rings]
        geoms = [g if g.is_valid else g.buffer(0) for g in geoms]
        tree = STRtree(geoms)
        centers = points(ctx.grid.xy)
        idx = tree.query_nearest(centers, all_matches=False, return_distance=True)
        dist = np.full(len(centers), np.nan)
        dist[idx[0][0]] = idx[1]
        return self._finish(ctx, np.minimum(dist, self.max_relevant))
