#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: air quality sensors → data/poi/environment.geojson (docs/data/poi-schema.md).

Catalog slug: `monitoring-jakosci-powietrza` (API action `get_bopipk_monitoring_jakosci_powietrza`),
licence CC BY — Urząd m.st. Warszawy.

The API returns only the latest hourly reading per station and keeps no history, so every
run appends the readings to `data/raw/{slug}/history.jsonl` (one row per station and hour)
and `meta.srednie` holds the averages over the last 24 hours and 7 days of that history,
with the number of hourly readings behind each. Run it hourly for the averages to mean
anything. Stations in neighbouring municipalities are kept (tag `poza_warszawa`) so
interpolation near the city border has data on both sides.

    uv run data/scripts/etl_powietrze.py            # fetch from the portal (needs UM_WARSZAWA_API_KEY)
    uv run data/scripts/etl_powietrze.py --offline  # rebuild from the cached response and history
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from generate_grid import load_districts
from poi_common import Districts, merge_into, point_feature
from um_api import DATA_DIR, ApiError, fetch, raw_path

SLUG = "monitoring-jakosci-powietrza"
ACTION = "bopipk_monitoring_jakosci_powietrza"
OUT_PATH = DATA_DIR / "poi" / "environment.geojson"
HISTORY_PATH = raw_path(SLUG).with_name("history.jsonl")
WINDOWS = {"24h": timedelta(hours=24), "7d": timedelta(days=7)}

Readings = dict[str, float | None]
History = dict[str, list[tuple[datetime, Readings]]]

# City sensors report "PM2.5", GIOŚ reference stations "PM25".
PARAM_KEYS = {"PM2.5": "pm25", "PM25": "pm25", "PM10": "pm10", "PM1": "pm1", "NO2": "no2", "O3": "o3",
              "CO": "co", "SO2": "so2", "C6H6": "c6h6", "T": "temperature", "P": "pressure", "H": "humidity"}
REPORTED = ("pm25", "pm10", "no2")


def readings(station: dict[str, Any]) -> tuple[dict[str, float | None], dict[str, str], str | None]:
    values: dict[str, float | None] = {key: None for key in REPORTED}
    units: dict[str, str] = {}
    time = None
    for d in station.get("data") or []:
        key = PARAM_KEYS.get(d.get("param_code"))
        if key is None or d.get("value") is None:
            continue
        values[key] = round(float(d["value"]), 2)
        units[key] = d.get("unit")
        time = time or d.get("time")
    return values, units, time


def parse_time(value: str | None) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace(" ", "T")) if value else None
    except ValueError:
        return None


def load_history(path: Path = HISTORY_PATH) -> History:
    history: History = {}
    if not path.exists():
        return history
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
            when = parse_time(row["czas"])
        except (ValueError, KeyError):
            continue
        if when:
            history.setdefault(row["stacja"], []).append((when, {k: row.get(k) for k in REPORTED}))
    return history


def append_history(stations: list[dict[str, Any]], path: Path = HISTORY_PATH) -> int:
    """Add each station's current hour once; returns how many new rows were written."""
    known = {(name, when) for name, rows in load_history(path).items() for when, _ in rows}
    new_rows = []
    for st in stations:
        name = st.get("name")
        values, _, time = readings(st)
        when = parse_time(time)
        if not name or when is None or (name, when) in known or all(v is None for v in values.values()):
            continue
        known.add((name, when))
        new_rows.append(json.dumps({"stacja": name, "czas": when.isoformat(), **values}, ensure_ascii=False))
    if new_rows:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as f:
            f.write("\n".join(new_rows) + "\n")
    return len(new_rows)


def averages(rows: list[tuple[datetime, Readings]], end: datetime) -> dict[str, dict[str, Any]]:
    """Mean per pollutant over each window ending at `end`; `n` is the hourly readings used."""
    out = {}
    for label, span in WINDOWS.items():
        window = [values for when, values in rows if end - span < when <= end]
        result: dict[str, Any] = {}
        for key in REPORTED:
            samples = [v[key] for v in window if v.get(key) is not None]
            result[key] = round(sum(samples) / len(samples), 1) if samples else None
            result[f"n_{key}"] = len(samples)
        out[label] = result
    return out


def normalize(station: dict[str, Any], districts: Districts, history: History | None = None,
              end: datetime | None = None) -> dict[str, Any] | None:
    try:
        lon, lat = float(station["lon"]), float(station["lat"])
    except (KeyError, TypeError, ValueError):
        return None
    name = station.get("name")
    if not name:
        return None
    values, units, time = readings(station)
    rows = (history or {}).get(name, [])
    window_end = end or max((when for when, _ in rows), default=None)
    return point_feature(
        lon,
        lat,
        source=SLUG,
        source_id=hashlib.sha1(name.encode()).hexdigest()[:12],
        category="environment",
        subtype="air_sensor",
        name=name,
        districts=districts,
        tags=["stacja_referencyjna"] if station.get("station_type") == "Stacja monitoringu" else [],
        meta={
            **values,
            "jednostki": units,
            "czas_pomiaru": time.replace(" ", "T") if time else None,
            "srednie": averages(rows, window_end) if rows and window_end else None,
            "srednie_do": window_end.isoformat() if rows and window_end else None,
            "indeks": (station.get("ijp") or {}).get("name"),
            "wlasciciel": station.get("owner"),
            "typ_stacji": station.get("station_type"),
        },
        keep_outside=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="use data/raw/{slug}/ instead of the API")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    districts = load_districts()
    try:
        stations = fetch(ACTION, SLUG, offline=args.offline)
    except ApiError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    added = append_history(stations)
    history = load_history()
    # One window end for every station (the newest reading overall), so averages compare like with like.
    end = max((when for rows in history.values() for when, _ in rows), default=None)

    pois, seen = [], set()
    for st in stations:
        poi = normalize(st, districts, history, end)
        if poi and poi["id"] not in seen:
            seen.add(poi["id"])
            pois.append(poi)

    kept = merge_into(args.output, SLUG, pois)
    outside = sum("poza_warszawa" in p["properties"]["tags"] for p in pois)
    no_pm25 = sum(p["properties"]["meta"]["pm25"] is None for p in pois)
    hours = sorted({when for rows in history.values() for when, _ in rows})
    span = f"{hours[0]:%Y-%m-%d %H:%M} – {hours[-1]:%Y-%m-%d %H:%M}" if hours else "brak"
    print(
        f"OK: {len(pois)} stacji → {args.output.relative_to(DATA_DIR.parent)} "
        f"(z API: {len(stations)}, poza Warszawą: {outside}, bez PM2.5: {no_pm25}, inne POI w pliku: {kept})\n"
        f"    historia: +{added} wierszy, {len(hours)} różnych czasów pomiaru ({span})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
