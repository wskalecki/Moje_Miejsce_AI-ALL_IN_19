"""Shared helpers for POI ETL scripts (docs/data/poi-schema.md)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from generate_grid import assign_cell, district_at

Districts = list[tuple[str, dict[str, Any]]]


def point_feature(
    lon: float,
    lat: float,
    *,
    source: str,
    source_id: str,
    category: str,
    subtype: str,
    name: str | None,
    districts: Districts,
    tags: list[str] | None = None,
    meta: dict[str, Any] | None = None,
    keep_outside: bool = False,
) -> dict[str, Any] | None:
    """A schema-conformant POI Feature, or None when the point lies outside Warsaw.

    keep_outside keeps such points (district null, tag `poza_warszawa`), for sources
    like air sensors whose neighbours outside the city still inform border cells.
    """
    tags = list(tags or [])
    district = district_at(lon, lat, districts) if districts else None
    if districts and district is None:
        if not keep_outside:
            return None  # the grid covers only the city
        tags.append("poza_warszawa")
    poi_id = f"{source}_{source_id}"
    return {
        "type": "Feature",
        "id": poi_id,
        "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
        "properties": {
            "id": poi_id,
            "category": category,
            "subtype": subtype,
            "name": name or None,
            "source": source,
            "sourceId": source_id,
            "cell_id": assign_cell(lon, lat),
            "district": district,
            "tags": tags,
            "meta": meta or {},
        },
    }


def merge_into(path: Path, source: str, features: list[dict[str, Any]]) -> int:
    """Replace this source's features in a category file; returns how many others were kept."""
    kept: list[dict[str, Any]] = []
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))
        kept = [f for f in existing.get("features", []) if f["properties"].get("source") != source]
    path.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "type": "FeatureCollection",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "features": kept + features,
    }
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return len(kept)
