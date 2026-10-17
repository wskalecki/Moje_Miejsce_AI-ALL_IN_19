"""Shared helpers for POI ETL scripts (docs/data/poi-schema.md)."""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from generate_grid import assign_cell, district_at

Districts = list[tuple[str, dict[str, Any]]]
Coord = tuple[float, float]  # (lon, lat)

LINE_SAMPLE_M = 20  # well under the grid cell side, so no crossed cell is skipped


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


def line_geometry(lines: list[list[Coord]]) -> dict[str, Any]:
    """GeoJSON for drawn parts: single-vertex parts become points, the rest lines."""
    rounded = [[[round(lon, 6), round(lat, 6)] for lon, lat in line] for line in lines]
    if all(len(line) == 1 for line in rounded):
        points = [line[0] for line in rounded]
        return {"type": "Point", "coordinates": points[0]} if len(points) == 1 else \
            {"type": "MultiPoint", "coordinates": points}
    lines_only = [line for line in rounded if len(line) > 1]
    return {"type": "LineString", "coordinates": lines_only[0]} if len(lines_only) == 1 else \
        {"type": "MultiLineString", "coordinates": lines_only}


def metres(a: Coord, b: Coord) -> float:
    dx = (b[0] - a[0]) * 111_320 * math.cos(math.radians((a[1] + b[1]) / 2))
    dy = (b[1] - a[1]) * 110_540
    return math.hypot(dx, dy)


def sample(line: list[Coord]) -> list[Coord]:
    if len(line) == 1:
        return list(line)
    out = []
    for a, b in zip(line, line[1:]):
        steps = max(1, math.ceil(metres(a, b) / LINE_SAMPLE_M))
        out += [(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps) for i in range(steps)]
    return out + [line[-1]]


def cells_crossed(lines: list[list[Coord]], districts: Districts) -> tuple[list[str], list[str]] | None:
    """(cell_ids, districts) for the parts inside Warsaw; None when entirely outside."""
    points = [pt for line in lines for pt in sample(line)]
    if not districts:
        return sorted({assign_cell(*pt) for pt in points}), []
    tagged = [(pt, district_at(*pt, districts)) for pt in points]
    inside = [(pt, d) for pt, d in tagged if d]
    if not inside:
        return None
    return sorted({assign_cell(*pt) for pt, _ in inside}), sorted({d for _, d in inside})


def write_collection(path: Path, features: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "type": "FeatureCollection",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "features": features,
    }
    # Compact: these files are committed and loaded by the app; one feature per line keeps diffs readable.
    lines = ",\n".join(json.dumps(f, ensure_ascii=False, separators=(",", ":")) for f in out["features"])
    header = json.dumps({k: v for k, v in out.items() if k != "features"}, ensure_ascii=False)[:-1]
    path.write_text(f'{header},"features":[\n{lines}\n]}}\n', encoding="utf-8")


def merge_into(path: Path, source: str, features: list[dict[str, Any]]) -> int:
    """Replace this source's features in a category file; returns how many others were kept."""
    kept: list[dict[str, Any]] = []
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))
        kept = [f for f in existing.get("features", []) if f["properties"].get("source") != source]
    write_collection(path, kept + features)
    return len(kept)
