#!/usr/bin/env python3
"""Compact per-category POI layers for the map filters (iteration 2, I2-4).

Reads the siatka POI outputs in ``data/poi/*.geojson`` and writes one file per app
category to ``application/public/data/poi/<category>.json``::

    {
      "category": "edukacja",
      "generated": "2026-10-17",
      "sources": [{"id": "osm", "label": "...", "licence": "...", "url": "..."}],
      "subtypes": {"kindergarten": "Przedszkole", ...},
      "points": [[lng, lat, name, subtype, sourceIndex], ...]
    }

``sourceIndex`` points into ``sources`` (provenance per point). Coordinates are rounded
to 5 decimals (~1 m). Categories without POIs (``cisza``) get an empty ``points`` list.

Standard library only:  python3 data/scripts/build_poi_layers.py
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POI_DIR = ROOT / "data" / "poi"
OUT_DIR = ROOT / "application" / "public" / "data" / "poi"

UM_CC_BY = "CC BY — Urząd m.st. Warszawy"
WFS_LIC = "Ponowne wykorzystanie bezpłatne; źródło: Urząd m.st. Warszawy"
OSM_LIC = "ODbL 1.0 — © współtwórcy OpenStreetMap"
UM_CATALOGUE = "https://dane.um.warszawa.pl/pl/catalogue"
WFS_URL = "https://wfs.um.warszawa.pl/serwis"

SOURCES = {
    "osm": ("OpenStreetMap (Overpass API)", OSM_LIC, "https://www.openstreetmap.org/copyright"),
    "lokalizacja-przystanow-komunikacji-miejskiej": (
        "dane.um.warszawa.pl — Lokalizacja przystanków komunikacji miejskiej",
        UM_CC_BY,
        UM_CATALOGUE,
    ),
    "wfs_metro": ("WFS m.st. Warszawy — METRO_WEJSCIA", WFS_LIC, WFS_URL),
    "otwarte-boiska": ("dane.um.warszawa.pl — Otwarte boiska", UM_CC_BY, UM_CATALOGUE),
    "kalendarz-wydarzen": ("dane.um.warszawa.pl — Kalendarz wydarzeń", UM_CC_BY, UM_CATALOGUE),
    "wfs_biblioteki": ("WFS m.st. Warszawy — BIBLIOTEKI", WFS_LIC, WFS_URL),
    "wfs_utw": ("WFS m.st. Warszawy — UNIWERSYTETY_TRZECIEGO_WIEKU", WFS_LIC, WFS_URL),
}

SUBTYPE_LABELS = {
    "park": "Park",
    "forest": "Las",
    "stop": "Przystanek",
    "tram_stop": "Przystanek tramwajowy",
    "metro_station": "Wejście do metra",
    "gastronomy": "Lokal gastronomiczny",
    "late_venue": "Lokal otwarty po 23:00",
    "pitch": "Otwarte boisko",
    "playground": "Plac zabaw",
    "library": "Biblioteka",
    "event": "Wydarzenie",
    "utw": "Uniwersytet Trzeciego Wieku",
    "kindergarten": "Przedszkole",
    "school": "Szkoła podstawowa",
    "high_school": "Szkoła średnia",
    "university": "Uczelnia",
    "clinic": "Przychodnia",
    "pharmacy": "Apteka",
    "supermarket": "Supermarket",
}

# app category -> list of (poi file, subtype) pairs
CATEGORY_RULES: dict[str, list[tuple[str, str]]] = {
    "cisza": [],
    "zielen": [("environment", "park"), ("environment", "forest")],
    "komunikacja": [("transit", "stop"), ("transit", "tram_stop"), ("transit", "metro_station")],
    "gastronomia": [("culture", "gastronomy")],
    "sport": [("sport", "pitch"), ("amenity", "playground")],
    "kultura": [("culture", "library"), ("culture", "event"), ("culture", "utw")],
    "edukacja": [
        ("education", "kindergarten"),
        ("education", "school"),
        ("education", "high_school"),
        ("education", "university"),
    ],
    "zdrowie": [("amenity", "clinic"), ("amenity", "pharmacy")],
    "zakupy": [("amenity", "supermarket")],
    # derived: gastronomy whose OSM opening_hours close at/after 23:00 (or 24/7)
    "zycieNocne": [("culture", "gastronomy@late")],
}

_TIME_RANGE = re.compile(r"(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})")


def is_late(opening_hours: str | None) -> bool:
    """True when any range ends at/after 23:00 or wraps past midnight."""
    if not opening_hours:
        return False
    if "24/7" in opening_hours:
        return True
    for h1, m1, h2, m2 in _TIME_RANGE.findall(opening_hours):
        start = int(h1) * 60 + int(m1)
        end = int(h2) * 60 + int(m2)
        if end >= 23 * 60 or end < start:
            return True
    return False


def load(name: str) -> list[dict]:
    path = POI_DIR / f"{name}.geojson"
    if not path.exists():
        print(f"  ! missing {path.relative_to(ROOT)} — skipped")
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("features", [])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", type=Path, default=OUT_DIR)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    cache: dict[str, list[dict]] = {}
    today = dt.date.today().isoformat()
    manifest = {}

    for cat, rules in CATEGORY_RULES.items():
        sources: list[str] = []
        subtypes: dict[str, str] = {}
        points: list[list] = []
        seen: set[tuple[float, float, str]] = set()
        for file, rule in rules:
            want, _, flag = rule.partition("@")
            feats = cache.setdefault(file, load(file))
            for f in feats:
                p = f.get("properties") or {}
                g = f.get("geometry") or {}
                if p.get("subtype") != want or g.get("type") != "Point":
                    continue
                if flag == "late" and not is_late((p.get("meta") or {}).get("opening_hours")):
                    continue
                lng, lat = (round(float(c), 5) for c in g["coordinates"][:2])
                subtype = "late_venue" if flag == "late" else want
                key = (lng, lat, subtype)
                if key in seen:
                    continue
                seen.add(key)
                src = p.get("source") or "unknown"
                if src not in sources:
                    sources.append(src)
                subtypes[subtype] = SUBTYPE_LABELS.get(subtype, subtype)
                points.append([lng, lat, (p.get("name") or "").strip(), subtype, sources.index(src)])

        out = {
            "category": cat,
            "generated": today,
            "note": "Built by data/scripts/build_poi_layers.py from data/poi/*.geojson",
            "sources": [
                {
                    "id": s,
                    "label": SOURCES.get(s, (s, "", ""))[0],
                    "licence": SOURCES.get(s, (s, "", ""))[1],
                    "url": SOURCES.get(s, (s, "", ""))[2],
                }
                for s in sources
            ],
            "subtypes": subtypes,
            "points": points,
        }
        path = args.out / f"{cat}.json"
        path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        manifest[cat] = len(points)
        print(f"  {cat:12s} {len(points):6d} pts  {path.stat().st_size / 1024:7.1f} KB  {', '.join(sources) or '-'}")

    print(f"wrote {len(manifest)} files to {args.out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
