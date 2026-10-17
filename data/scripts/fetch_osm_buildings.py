#!/usr/bin/env python3
"""Pobierz footprinty budynków OSM dla bbox z manifestu → GeoJSON do demo offline."""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / "data/manifest.json"
DEFAULT_OUT = REPO_ROOT / "data/samples/osm_buildings_sample.geojson"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Bbox siatki próbki (węższy niż manifest — mniej danych, szybszy Overpass)
SAMPLE_BBOX = (20.976, 52.181, 21.06, 52.244)


def load_bbox() -> tuple[float, float, float, float]:
    return SAMPLE_BBOX


def overpass_buildings(west: float, south: float, east: float, north: float) -> dict:
    """Prefer Node fetch (lepsze TLS); fallback na urllib."""
    import subprocess

    node = REPO_ROOT / "data/scripts/fetch_osm_buildings_overpass.mjs"
    if node.is_file():
        proc = subprocess.run(
            [
                "node",
                str(node),
                str(south),
                str(west),
                str(north),
                str(east),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(proc.stdout)

    query = f"""
    [out:json][timeout:180];
    way["building"]({south},{west},{north},{east});
    out geom;
    """
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(
        OVERPASS_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "wwa42hackathon-siatka/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=200) as resp:
        return json.loads(resp.read().decode("utf-8"))


def parse_height(tags: dict) -> float | None:
    for key in ("height", "building:height", "roof:height"):
        raw = tags.get(key)
        if raw is None:
            continue
        try:
            return float(str(raw).split(" ", 1)[0].replace(",", "."))
        except ValueError:
            continue
    levels = tags.get("building:levels") or tags.get("levels")
    if levels is not None:
        try:
            return float(str(levels).split(";", 1)[0]) * 3.2
        except ValueError:
            pass
    return None


def way_to_feature(element: dict) -> dict | None:
    geom = element.get("geometry")
    if not geom or len(geom) < 4:
        return None
    coords = [[pt["lon"], pt["lat"]] for pt in geom]
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    tags = element.get("tags") or {}
    osm_id = str(element["id"])
    height = parse_height(tags)
    return {
        "type": "Feature",
        "id": osm_id,
        "geometry": {"type": "Polygon", "coordinates": [coords]},
        "properties": {
            "osm_id": osm_id,
            "osm_type": element.get("type", "way"),
            "building": tags.get("building", "yes"),
            "name": tags.get("name"),
            "height": height,
            "min_height": 0,
            "category": None,
            "poi_id": None,
        },
    }


def main() -> None:
    west, south, east, north = load_bbox()
    print(f"Fetching OSM buildings in bbox W={west} S={south} E={east} N={north} …")
    try:
        payload = overpass_buildings(west, south, east, north)
    except urllib.error.URLError as exc:
        raise SystemExit(f"Overpass request failed: {exc}") from exc

    features: list[dict] = []
    for el in payload.get("elements", []):
        if el.get("type") != "way":
            continue
        feat = way_to_feature(el)
        if feat:
            features.append(feat)

    out = {
        "type": "FeatureCollection",
        "description": (
            "Budynki OSM (way) w bbox manifestu — offline demo. "
            "Regeneruj: python3 data/scripts/fetch_osm_buildings.py"
        ),
        "metadata": {
            "source": "openstreetmap.org via Overpass API",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "bbox": [west, south, east, north],
            "feature_count": len(features),
        },
        "features": features,
    }

    DEFAULT_OUT.parent.mkdir(parents=True, exist_ok=True)
    DEFAULT_OUT.write_text(
        json.dumps(out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    size_mb = DEFAULT_OUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {len(features)} buildings → {DEFAULT_OUT} ({size_mb:.2f} MiB)")


if __name__ == "__main__":
    main()
