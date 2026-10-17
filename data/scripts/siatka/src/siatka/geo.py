"""Vectorised geometry helpers in a metric CRS (EPSG:2180, PL-1992)."""

from __future__ import annotations

from typing import Sequence

import numpy as np
from pyproj import Transformer

_TO_2180 = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True)
_CHUNK = 256


def to_xy(lons: Sequence[float], lats: Sequence[float]) -> np.ndarray:
    x, y = _TO_2180.transform(np.asarray(lons, float), np.asarray(lats, float))
    return np.column_stack([x, y]) if np.ndim(x) else np.array([[x, y]])


def _pairwise(a: np.ndarray, b: np.ndarray):
    """Yield (row_slice, distance matrix chunk) between rows of a and all rows of b."""
    for start in range(0, len(a), _CHUNK):
        chunk = a[start : start + _CHUNK]
        d = np.sqrt(((chunk[:, None, :] - b[None, :, :]) ** 2).sum(axis=2))
        yield slice(start, start + len(chunk)), d


def nearest_distance(origins: np.ndarray, targets: np.ndarray) -> np.ndarray:
    """Distance in metres from each origin to the nearest target (NaN if no targets)."""
    out = np.full(len(origins), np.nan)
    if len(targets) == 0:
        return out
    for sl, d in _pairwise(origins, targets):
        out[sl] = d.min(axis=1)
    return out


def count_within(origins: np.ndarray, targets: np.ndarray, radius: float) -> np.ndarray:
    out = np.zeros(len(origins))
    if len(targets) == 0:
        return out
    for sl, d in _pairwise(origins, targets):
        out[sl] = (d <= radius).sum(axis=1)
    return out


def idw(
    origins: np.ndarray,
    targets: np.ndarray,
    values: np.ndarray,
    power: float = 2.0,
    max_distance: float = 5000.0,
) -> np.ndarray:
    """Inverse-distance-weighted value of targets around each origin (NaN if none within range)."""
    out = np.full(len(origins), np.nan)
    if len(targets) == 0:
        return out
    for sl, d in _pairwise(origins, targets):
        d = np.maximum(d, 1.0)
        w = np.where(d <= max_distance, 1.0 / d**power, 0.0)
        total = w.sum(axis=1)
        with np.errstate(invalid="ignore", divide="ignore"):
            out[sl] = np.where(total > 0, (w * values[None, :]).sum(axis=1) / total, np.nan)
    return out
