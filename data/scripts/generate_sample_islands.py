#!/usr/bin/env python3
"""Build cell_metrics_sample.json as persona islands (2 km gradient from anchor POIs)."""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GRID_PATH = REPO_ROOT / "data/samples/warsaw_grid_sample.geojson"
METRICS_PATH = REPO_ROOT / "data/samples/cell_metrics_sample.json"

PERSONAS = ("kasia", "marek", "ania_tomek")
RADIUS_M = 2000
SCORE_PEAK = 92
SCORE_EDGE = 36

# Kotwice w bbox próbki (Mokotów) — współrzędne [lon, lat]
ANCHORS = {
    "ania_tomek": {
        "lon": 21.008,
        "lat": 52.208,
        "label": "Szkoła podstawowa nr 1 demo",
        "narrative": [
            "Blisko szkoły — wygodny dojazd pieszo z dziećmi.",
            "W promieniu 2 km maleje „fit rodzinny” — im dalej, tym niższy wynik.",
        ],
    },
    "marek": {
        "lon": 21.022,
        "lat": 52.215,
        "label": "Węzeł komunikacji Mokotów",
        "narrative": [
            "Silny węzeł tramwajowy — persona „centrum”.",
            "Gradient do 2 km od przystanków.",
        ],
    },
    "kasia": {
        "lon": 21.038,
        "lat": 52.192,
        "label": "Strefa zieleni / spokoju demo",
        "narrative": [
            "Ciszej i mniej ruchu — persona „spokój”.",
            "Najlepiej w pierwszym kilometrze od parku.",
        ],
    },
}


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def cell_noise_01(cell_id: str) -> float:
    h = 2166136261
    for ch in cell_id:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return ((h % 10_000) / 10_000) * 2 - 1


def _smoothstep01(x: float) -> float:
    t = max(0.0, min(1.0, x))
    return t * t * (3.0 - 2.0 * t)


def score_from_distance(distance_m: float) -> int | None:
    if distance_m > RADIUS_M:
        return None
    t = distance_m / RADIUS_M
    return int(round(SCORE_PEAK - t * (SCORE_PEAK - SCORE_EDGE)))


def marek_effective_distance_m(lon: float, lat: float, anchor_lon: float, anchor_lat: float, cell_id: str) -> float:
    noise = cell_noise_01(cell_id)
    cos_lat = math.cos(math.radians(anchor_lat))
    m_per_deg_lat = 111_320
    m_per_deg_lon = 111_320 * cos_lat
    d_lon = (lon - anchor_lon) * cos_lat
    d_lat = lat - anchor_lat
    dx = d_lon * m_per_deg_lon * 0.68
    dy = d_lat * m_per_deg_lat * 1.14
    distance_m = math.hypot(dx, dy)
    return distance_m * (1.0 - 0.1 * noise)


def marek_score_at(lon: float, lat: float, anchor_lon: float, anchor_lat: float, cell_id: str) -> int | None:
    noise = cell_noise_01(cell_id)
    distance_m = marek_effective_distance_m(lon, lat, anchor_lon, anchor_lat, cell_id)
    radius_m = RADIUS_M * (1.0 + 0.2 * noise)
    outer = radius_m * (1.03 + 0.1 * max(0.0, noise))
    if distance_m > outer:
        return None
    t = distance_m / radius_m
    smooth = _smoothstep01(1.0 - t)
    raw = SCORE_EDGE + (SCORE_PEAK - SCORE_EDGE) * smooth + noise * 7
    return int(round(max(SCORE_EDGE, min(SCORE_PEAK, raw))))


def synthetic_metrics(distance_m: float | None, persona: str) -> dict:
    if distance_m is None:
        return {}
    near = max(0.0, 1.0 - distance_m / RADIUS_M)
    base = {
        "transit_stops_count": int(round(2 + near * 10)) if persona == "marek" else int(round(near * 4)),
        "tram_lines_nearby": int(round(near * 4)) if persona == "marek" else int(round(near * 2)),
        "aq_pm25_nearest": round(22 - near * 8, 1),
        "toilets_with_changing_table": 1 if persona == "ania_tomek" and near > 0.4 else 0,
        "sport_places": int(round(near * 3)),
        "events_30d": int(round(near * 5)),
        "rcn_m2_median_district": int(10_000 + near * 4000),
    }
    if persona == "ania_tomek":
        base["schools_primary_2km"] = 1 if distance_m <= RADIUS_M else 0
    return base


def main() -> None:
    grid = json.loads(GRID_PATH.read_text(encoding="utf-8"))
    cells_out: dict[str, dict] = {}

    for feat in grid["features"]:
        cid = feat["properties"]["id"]
        lon, lat = feat["properties"]["center"]
        scores: dict[str, int | None] = {}
        distances: dict[str, float] = {}

        for persona in PERSONAS:
            anchor = ANCHORS[persona]
            d = haversine_m(lon, lat, anchor["lon"], anchor["lat"])
            distances[persona] = d
            if persona == "marek":
                scores[persona] = marek_score_at(lon, lat, anchor["lon"], anchor["lat"], cid)
            else:
                scores[persona] = score_from_distance(d)

        if not any(s is not None for s in scores.values()):
            continue

        # Metryki z kotwicy „najbliższej” dla narracji
        best_persona = min(
            (p for p in PERSONAS if scores[p] is not None),
            key=lambda p: distances[p],
        )
        anchor = ANCHORS[best_persona]
        d_best = distances[best_persona]

        cells_out[cid] = {
            "scores": scores,
            "metrics": synthetic_metrics(d_best, best_persona),
            "narrative": {"pl": list(anchor["narrative"])},
            "commute_heuristic_min": {"mokotow_demo": int(12 + d_best / 120)},
        }

    payload = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "personas": list(PERSONAS),
        "islands": {
            p: {
                "anchor": [ANCHORS[p]["lon"], ANCHORS[p]["lat"]],
                "radiusM": RADIUS_M,
                "label": ANCHORS[p]["label"],
            }
            for p in PERSONAS
        },
        "cells": cells_out,
    }

    METRICS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(cells_out)} island cells to {METRICS_PATH}")


if __name__ == "__main__":
    main()
