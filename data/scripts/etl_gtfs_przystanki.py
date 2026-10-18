#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""ETL: lines and modes per stop from the GTFS timetable → data/poi_mikolaj/transit.geojson.

Run after etl_przystanki.py (it rewrites transit.geojson). For one weekday of the feed it adds
to every stop post `meta.linie`, `meta.tryby` and `meta.odjazdy_dzien` (departures that day),
and adds metro and rail stations as `metro_station` / `rail_station` POI (source `gtfs`),
which the city stops dataset lacks. Feed: gtfs_feed.py (data/raw/gtfs/warsaw.zip).

    uv run data/scripts/etl_gtfs_przystanki.py                 # first weekday in the feed
    uv run data/scripts/etl_gtfs_przystanki.py --data 20261021
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

from generate_grid import load_districts
from gtfs_feed import ATTRIBUTION, Feed, platform_parent
from poi_common import POI_DIR, point_feature, write_collection
from um_api import DATA_DIR

OUT_PATH = POI_DIR / "transit.geojson"
STOPS_SOURCE = "lokalizacja-przystanow-komunikacji-miejskiej"
SOURCE = "gtfs"
STATION_SUBTYPES = {"metro": "metro_station", "kolej": "rail_station"}


def first_weekday(dates: list[str]) -> str:
    for d in sorted(dates):
        if date(int(d[:4]), int(d[4:6]), int(d[6:])).weekday() < 5:
            return d
    raise ValueError("W kalendarzu GTFS nie ma dnia roboczego")


def lines_per_stop(feed: Feed, day: str) -> tuple[dict[str, set[str]], Counter[str], dict]:
    """stop_id → route_ids, stop_id → departures that day, routes."""
    services = feed.service_dates().get(day)
    if not services:
        raise ValueError(f"Dnia {day} nie ma w kalendarzu GTFS")
    routes = feed.routes()
    trips = feed.trips(services)
    runs = {trip: sum(len(range(s, e, h)) for s, e, h in windows)
            for trip, windows in feed.frequencies(set(trips)).items()}
    served: dict[str, set[str]] = defaultdict(set)
    departures: Counter[str] = Counter()
    for st in feed.stop_times(set(trips)):
        served[st.stop_id].add(trips[st.trip_id])
        departures[st.stop_id] += runs.get(st.trip_id, 1)
    return served, departures, routes


def describe(route_ids: set[str], routes: dict) -> tuple[list[str], list[str]]:
    known = [routes[r] for r in route_ids if r in routes]
    lines = sorted({r.name for r in known}, key=lambda n: (not n.isdigit(), n.zfill(4)))
    return lines, sorted({r.mode for r in known})


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data", help="service day YYYYMMDD (default: first weekday in the feed)")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    if not args.output.exists():
        print(f"BŁĄD: brak {args.output}; najpierw uruchom etl_przystanki.py", file=sys.stderr)
        return 1
    try:
        feed = Feed()
    except FileNotFoundError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1

    day = args.data or first_weekday(list(feed.service_dates()))
    served, departures, routes = lines_per_stop(feed, day)
    stops = feed.stops()
    districts = load_districts()

    collection = json.loads(args.output.read_text(encoding="utf-8"))
    kept, enriched, unmatched = [], 0, 0
    for f in collection["features"]:
        p = f["properties"]
        if p.get("source") == SOURCE:
            continue  # stations are rebuilt below
        if p.get("source") == STOPS_SOURCE:
            lines, modes = describe(served.get(p["sourceId"], set()), routes)
            p["meta"].update({"linie": lines or None, "tryby": modes or None,
                              "odjazdy_dzien": departures.get(p["sourceId"], 0), "rozklad_dzien": day})
            p["tags"] = sorted(set(p.get("tags") or []) | set(modes))
            enriched += bool(lines)
            unmatched += not lines
        kept.append(f)

    # Metro platforms roll up to their station (3009M:P1 → 3009M); SKM stops (e.g. 4900) are
    # standalone and absent from the city stops dataset, so they are stations themselves.
    our_posts = {f["properties"]["sourceId"] for f in kept if f["properties"].get("source") == STOPS_SOURCE}
    station_routes: dict[str, set[str]] = defaultdict(set)
    station_departures: Counter[str] = Counter()
    for stop_id, route_ids in served.items():
        parent = platform_parent(stops, stop_id)
        rail_or_metro = any(routes[r].mode in STATION_SUBTYPES for r in route_ids if r in routes)
        if parent == stop_id and (stop_id in our_posts or not rail_or_metro):
            continue
        station_routes[parent] |= route_ids
        station_departures[parent] += departures[stop_id]

    stations = []
    for station_id, route_ids in station_routes.items():
        lines, modes = describe(route_ids, routes)
        mode = next((m for m in ("metro", "kolej") if m in modes), None)
        s = stops.get(station_id)
        if not mode or not s:
            continue
        poi = point_feature(
            float(s["stop_lon"]), float(s["stop_lat"]),
            source=SOURCE, source_id=station_id, category="transit", subtype=STATION_SUBTYPES[mode],
            name=s["stop_name"], districts=districts, tags=modes,
            meta={"linie": lines, "tryby": modes, "odjazdy_dzien": station_departures[station_id],
                  "rozklad_dzien": day, "zrodlo": ATTRIBUTION},
        )
        if poi:
            stations.append(poi)

    write_collection(args.output, kept + stations)
    by_mode = Counter(s["properties"]["subtype"] for s in stations)
    print(
        f"OK: dzień {day} (GTFS {feed.version()}): {enriched} słupków z liniami, {unmatched} bez kursów tego dnia, "
        f"+{len(stations)} stacji ({dict(by_mode)}) → {args.output.relative_to(DATA_DIR.parent)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
