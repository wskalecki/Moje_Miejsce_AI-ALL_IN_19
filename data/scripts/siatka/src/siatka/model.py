"""Core types: data sources, points of interest, datasets."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

# Must stay in sync with docs/data/poi-schema.md and data/scripts/validate_data.py
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


@dataclass(frozen=True)
class Source:
    """Where a dataset comes from — shown in the app and in data/README.md."""

    name: str
    url: str
    license: str
    slug: str | None = None  # Warsaw open data catalog slug, when applicable
    city_open_data: bool = False  # True for dane.um.warszawa.pl / city API (regulamin §4 ust. 9)


@dataclass
class POI:
    source_key: str
    source_id: str
    category: str
    subtype: str
    lon: float
    lat: float
    name: str | None = None
    tags: list[str] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)
    cell_id: str | None = None

    def __post_init__(self) -> None:
        if self.category not in POI_CATEGORIES:
            raise ValueError(f"Unknown POI category {self.category!r}")

    def to_feature(self) -> dict[str, Any]:
        props: dict[str, Any] = {
            "id": f"{self.source_key}_{self.source_id}",
            "category": self.category,
            "subtype": self.subtype,
            "source": self.source_key,
            "sourceId": self.source_id,
            "cell_id": self.cell_id,
        }
        if self.name:
            props["name"] = self.name
        if self.tags:
            props["tags"] = self.tags
        if self.meta:
            props["meta"] = self.meta
        return {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(self.lon, 6), round(self.lat, 6)]},
            "properties": props,
        }


@dataclass
class Dataset:
    """A fetchable collection of POIs. Register with the @dataset decorator."""

    key: str
    source: Source
    fetch: Callable[[], list[POI]]
    publish: bool = True  # write to data/poi/<category>.geojson for the map
    fetched_at: str | None = None


DATASETS: dict[str, Dataset] = {}


def dataset(key: str, source: Source, publish: bool = True):
    """Decorator registering a fetch function as a named dataset."""

    def wrap(fn: Callable[[], list[POI]]) -> Callable[[], list[POI]]:
        if key in DATASETS:
            raise ValueError(f"Dataset {key!r} registered twice")
        DATASETS[key] = Dataset(key=key, source=source, fetch=fn, publish=publish)
        return fn

    return wrap
