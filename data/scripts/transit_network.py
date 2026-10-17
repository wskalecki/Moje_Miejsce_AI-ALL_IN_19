"""Public transport network for one service day, built from the GTFS feed (gtfs_feed.py).

A network is a list of elementary connections (one vehicle between two consecutive stops),
sorted by departure, plus every stop's position. Metro runs are expanded from frequencies.
Built once per day and cached as gzip CSV in data/raw/gtfs/siec_{YYYYMMDD}.csv.gz (gitignored).
"""

from __future__ import annotations

import csv
import gzip
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

from gtfs_feed import FEED_PATH, Feed, StopTime, expand_frequencies

CACHE_DIR = FEED_PATH.parent
CACHE_VERSION = "1"


@dataclass(frozen=True)
class Connection:
    dep_stop: int
    arr_stop: int
    dep: int  # seconds after the service day's midnight
    arr: int
    trip: int
    route: int


@dataclass
class Network:
    day: str
    stop_ids: list[str]
    stop_names: list[str]
    lons: list[float]
    lats: list[float]
    route_names: list[str]
    route_modes: list[str]
    connections: list[Connection] = field(default_factory=list)

    def stop_index(self) -> dict[str, int]:
        return {sid: i for i, sid in enumerate(self.stop_ids)}


def build(feed: Feed, day: str) -> Network:
    services = feed.service_dates().get(day)
    if not services:
        raise ValueError(f"Dnia {day} nie ma w kalendarzu GTFS")
    routes = feed.routes()
    trips = feed.trips(services)
    frequencies = feed.frequencies(set(trips))

    by_trip: dict[str, list[StopTime]] = defaultdict(list)
    for st in feed.stop_times(set(trips)):
        by_trip[st.trip_id].append(st)

    stops = {sid: s for sid, s in feed.stops().items() if s.get("location_type", "0") in ("", "0")}
    stop_ids = sorted(stops)
    stop_idx = {sid: i for i, sid in enumerate(stop_ids)}
    route_ids = sorted(routes)
    route_idx = {rid: i for i, rid in enumerate(route_ids)}

    connections: list[Connection] = []
    trip_counter = 0
    for trip_id, times in by_trip.items():
        runs = expand_frequencies(times, frequencies[trip_id]) if trip_id in frequencies \
            else [sorted(times, key=lambda st: st.sequence)]
        for run in runs:
            for a, b in zip(run, run[1:]):
                if a.stop_id in stop_idx and b.stop_id in stop_idx and b.arrival >= a.departure:
                    connections.append(Connection(stop_idx[a.stop_id], stop_idx[b.stop_id], a.departure,
                                                  b.arrival, trip_counter, route_idx[trips[trip_id]]))
            trip_counter += 1
    connections.sort(key=lambda c: (c.dep, c.arr))

    return Network(
        day=day,
        stop_ids=stop_ids,
        stop_names=[stops[s]["stop_name"] for s in stop_ids],
        lons=[float(stops[s]["stop_lon"]) for s in stop_ids],
        lats=[float(stops[s]["stop_lat"]) for s in stop_ids],
        route_names=[routes[r].name for r in route_ids],
        route_modes=[routes[r].mode for r in route_ids],
        connections=connections,
    )


def cache_path(day: str) -> Path:
    return CACHE_DIR / f"siec_{day}.csv.gz"


def save(net: Network, path: Path) -> None:
    with gzip.open(path, "wt", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["#siec", CACHE_VERSION, net.day])
        w.writerow(["#stops", len(net.stop_ids)])
        for row in zip(net.stop_ids, net.stop_names, net.lons, net.lats):
            w.writerow(row)
        w.writerow(["#routes", len(net.route_names)])
        for row in zip(net.route_names, net.route_modes):
            w.writerow(row)
        w.writerow(["#connections", len(net.connections)])
        for c in net.connections:
            w.writerow((c.dep_stop, c.arr_stop, c.dep, c.arr, c.trip, c.route))


def load(path: Path) -> Network:
    with gzip.open(path, "rt", encoding="utf-8", newline="") as f:
        r = csv.reader(f)
        header = next(r)
        if header[:2] != ["#siec", CACHE_VERSION]:
            raise ValueError(f"{path}: nieznany format cache")
        n_stops = int(next(r)[1])
        stops = [next(r) for _ in range(n_stops)]
        n_routes = int(next(r)[1])
        routes = [next(r) for _ in range(n_routes)]
        n_conn = int(next(r)[1])
        connections = [Connection(*map(int, next(r))) for _ in range(n_conn)]
    return Network(
        day=header[2],
        stop_ids=[s[0] for s in stops],
        stop_names=[s[1] for s in stops],
        lons=[float(s[2]) for s in stops],
        lats=[float(s[3]) for s in stops],
        route_names=[x[0] for x in routes],
        route_modes=[x[1] for x in routes],
        connections=connections,
    )


def network_for(day: str, feed: Feed | None = None, rebuild: bool = False) -> Network:
    path = cache_path(day)
    if path.exists() and not rebuild:
        return load(path)
    net = build(feed or Feed(), day)
    path.parent.mkdir(parents=True, exist_ok=True)
    save(net, path)
    return net
