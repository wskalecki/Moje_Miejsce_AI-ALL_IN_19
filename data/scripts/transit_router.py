#!/usr/bin/env python3
"""Earliest-arrival public transport routing (Connection Scan Algorithm) with walking.

Journeys start and end at any point: walk to stops within ACCESS_M, ride, transfer on foot
between stops within TRANSFER_M (at least MIN_TRANSFER_S), walk from the last stop. Walking is
straight-line distance × DETOUR at WALK_MPS. `modes` limits the vehicles used (e.g. {"tramwaj"}).

Known simplification: footpaths are relaxed one hop from each vehicle arrival (not transitively
closed), which can miss a walk-walk chain between three stops; with 400 m transfers this rarely
matters.

    python3 data/scripts/transit_router.py 21.0122 52.2297 21.0170 52.1430 --at 08:00
    python3 data/scripts/transit_router.py 21.0122 52.2297 21.0170 52.1430 --at 08:00 --modes tramwaj
"""

from __future__ import annotations

import argparse
import bisect
import math
import sys
from dataclasses import dataclass

from transit_network import Network, network_for

WALK_MPS = 1.3          # ~4.7 km/h
DETOUR = 1.3            # street network vs straight line
ACCESS_M = 800          # max walk to the first / from the last stop
TRANSFER_M = 400        # max walk between stops when changing
MIN_TRANSFER_S = 60     # time to change vehicles, even at the same stop
MAX_RIDE_S = 3 * 3600   # stop scanning this long after departure

INF = float("inf")


def metres(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    dx = (lon2 - lon1) * 111_320 * math.cos(math.radians((lat1 + lat2) / 2))
    dy = (lat2 - lat1) * 110_540
    return math.hypot(dx, dy)


def walk_s(m: float) -> int:
    return round(m * DETOUR / WALK_MPS)


@dataclass
class Leg:
    kind: str  # "pieszo" or a mode ("autobus", "tramwaj", "metro", "kolej")
    start: int
    end: int
    line: str | None = None
    from_stop: str | None = None
    to_stop: str | None = None
    metres: int | None = None


@dataclass
class Journey:
    departure: int
    arrival: int
    legs: list[Leg]

    @property
    def minutes(self) -> float:
        return (self.arrival - self.departure) / 60

    @property
    def transfers(self) -> int:
        return max(0, sum(leg.kind != "pieszo" for leg in self.legs) - 1)


class Router:
    def __init__(self, net: Network):
        self.net = net
        self.deps = [c.dep for c in net.connections]
        self._cell = 0.01  # ~1 km buckets for the stop index
        self._buckets: dict[tuple[int, int], list[int]] = {}
        for i, (lon, lat) in enumerate(zip(net.lons, net.lats)):
            self._buckets.setdefault(self._key(lon, lat), []).append(i)
        self._transfers: dict[int, list[tuple[int, int]]] = {}

    def _key(self, lon: float, lat: float) -> tuple[int, int]:
        return int(lon / self._cell), int(lat / self._cell)

    def stops_near(self, lon: float, lat: float, radius_m: float) -> list[tuple[int, float]]:
        kx, ky = self._key(lon, lat)
        out = []
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for i in self._buckets.get((kx + dx, ky + dy), []):
                    d = metres(lon, lat, self.net.lons[i], self.net.lats[i])
                    if d <= radius_m:
                        out.append((i, d))
        return out

    def transfers_from(self, stop: int) -> list[tuple[int, int]]:
        if stop not in self._transfers:
            self._transfers[stop] = [(j, walk_s(d)) for j, d in
                                     self.stops_near(self.net.lons[stop], self.net.lats[stop], TRANSFER_M)
                                     if j != stop]
        return self._transfers[stop]

    def route(self, origin: tuple[float, float], target: tuple[float, float], depart: int,
              modes: set[str] | None = None) -> Journey | None:
        net = self.net
        direct_m = metres(*origin, *target)
        best = depart + walk_s(direct_m) if direct_m <= ACCESS_M * 2 else INF
        best_journey: list[Leg] | None = [Leg("pieszo", depart, int(best), metres=round(direct_m))] \
            if best < INF else None

        # arrival[s]: earliest time at stop s, ready to board (transfer buffer included after a ride)
        arrival: dict[int, float] = {}
        parent: dict[int, tuple] = {}
        for s, d in self.stops_near(*origin, ACCESS_M):
            t = depart + walk_s(d)
            if t < arrival.get(s, INF):
                arrival[s] = t
                parent[s] = ("access", depart, t, round(d))
        egress = {s: d for s, d in self.stops_near(*target, ACCESS_M)}
        if not arrival or not egress:
            return Journey(depart, int(best), best_journey) if best_journey else None

        boarded: dict[int, int] = {}  # trip → index of the connection where it was boarded
        start = bisect.bisect_left(self.deps, depart)
        end_time = depart + MAX_RIDE_S
        for ci in range(start, len(net.connections)):
            c = net.connections[ci]
            if c.dep >= best or c.dep > end_time:
                break
            if modes is not None and net.route_modes[c.route] not in modes:
                continue
            if c.trip not in boarded:
                if arrival.get(c.dep_stop, INF) > c.dep:
                    continue
                boarded[c.trip] = ci
            if c.arr + MIN_TRANSFER_S < arrival.get(c.arr_stop, INF):
                arrival[c.arr_stop] = c.arr + MIN_TRANSFER_S
                parent[c.arr_stop] = ("ride", boarded[c.trip], ci)
                for j, secs in self.transfers_from(c.arr_stop):
                    t = c.arr + max(secs, MIN_TRANSFER_S)
                    if t < arrival.get(j, INF):
                        arrival[j] = t
                        parent[j] = ("walk", c.arr_stop, c.arr, t, secs)
                if c.arr_stop in egress:
                    t = c.arr + walk_s(egress[c.arr_stop])
                    if t < best:
                        best = t
                        best_journey = self._legs(parent, c.arr_stop) + [
                            Leg("pieszo", c.arr, t, metres=round(egress[c.arr_stop]))]
        if best_journey is None:
            return None
        return Journey(depart, int(best), best_journey)

    def latest_departures(self, target: tuple[float, float], deadline: int,
                          modes: set[str] | None = None) -> dict[int, int]:
        """For every stop, the latest time a vehicle can be boarded there to reach `target` by `deadline`.

        Reverse Connection Scan: connections are scanned from the deadline backwards. One scan answers
        "how late can I leave" for all origins at once, which is what many-to-one averages need.
        """
        net = self.net
        # ready[s]: latest time to be at stop s, ready to continue (transfer buffer included)
        ready: dict[int, float] = {}
        for s, d in self.stops_near(*target, ACCESS_M):
            ready[s] = max(ready.get(s, -INF), deadline - walk_s(d))
        board: dict[int, int] = {}
        usable_trips: set[int] = set()
        if not ready:
            return board

        end = bisect.bisect_right(self.deps, deadline)
        start_time = deadline - MAX_RIDE_S
        for ci in range(end - 1, -1, -1):
            c = net.connections[ci]
            if c.dep < start_time:
                break
            if c.arr > deadline or (modes is not None and net.route_modes[c.route] not in modes):
                continue
            if c.trip not in usable_trips:
                if c.arr > ready.get(c.arr_stop, -INF):
                    continue
                usable_trips.add(c.trip)
            if c.dep > board.get(c.dep_stop, -1):
                board[c.dep_stop] = c.dep
            latest = c.dep - MIN_TRANSFER_S
            if latest > ready.get(c.dep_stop, -INF):
                ready[c.dep_stop] = latest
                for j, secs in self.transfers_from(c.dep_stop):
                    t = c.dep - max(secs, MIN_TRANSFER_S)
                    if t > ready.get(j, -INF):
                        ready[j] = t
        return board

    def latest_leave(self, origin: tuple[float, float], board: dict[int, int], target: tuple[float, float],
                     deadline: int, access: list[tuple[int, float]] | None = None) -> float | None:
        """Latest time to leave `origin` on foot and still arrive by `deadline` (None: not possible).

        `board` comes from latest_departures; `access` (stops near origin) can be passed in when the
        same origin is evaluated many times.
        """
        direct_m = metres(*origin, *target)
        best = deadline - walk_s(direct_m) if direct_m <= ACCESS_M * 2 else -INF
        for s, d in access if access is not None else self.stops_near(*origin, ACCESS_M):
            if s in board:
                best = max(best, board[s] - walk_s(d))
        return best if best > -INF else None

    def _legs(self, parent: dict[int, tuple], stop: int) -> list[Leg]:
        net = self.net
        legs: list[Leg] = []
        while True:
            p = parent[stop]
            if p[0] == "access":
                legs.append(Leg("pieszo", p[1], p[2], metres=p[3]))
                break
            if p[0] == "walk":
                _, prev, start, end, secs = p
                legs.append(Leg("pieszo", start, start + secs, from_stop=net.stop_names[prev],
                                to_stop=net.stop_names[stop], metres=round(secs * WALK_MPS / DETOUR)))
                stop = prev
                continue
            _, first, last = p
            a, b = net.connections[first], net.connections[last]
            legs.append(Leg(net.route_modes[a.route], a.dep, b.arr, line=net.route_names[a.route],
                            from_stop=net.stop_names[a.dep_stop], to_stop=net.stop_names[b.arr_stop]))
            stop = a.dep_stop
        return legs[::-1]


def hhmm(seconds: float) -> str:
    seconds = int(seconds)
    return f"{seconds // 3600:02d}:{seconds % 3600 // 60:02d}"


def parse_hhmm(text: str) -> int:
    h, m = text.split(":")
    return int(h) * 3600 + int(m) * 60


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("coords", nargs=4, type=float, metavar=("LON_Z", "LAT_Z", "LON_DO", "LAT_DO"))
    parser.add_argument("--at", default="08:00", help="departure HH:MM")
    parser.add_argument("--day", default="20261019", help="service day YYYYMMDD")
    parser.add_argument("--modes", nargs="*", help="autobus tramwaj metro kolej (default: all)")
    args = parser.parse_args()

    router = Router(network_for(args.day))
    j = router.route(tuple(args.coords[:2]), tuple(args.coords[2:]), parse_hhmm(args.at),
                     set(args.modes) if args.modes else None)
    if j is None:
        print("Brak połączenia w zasięgu")
        return 1
    print(f"{hhmm(j.departure)} → {hhmm(j.arrival)}: {j.minutes:.0f} min, przesiadek: {j.transfers}")
    for leg in j.legs:
        if leg.kind == "pieszo":
            print(f"  {hhmm(leg.start)}–{hhmm(leg.end)}  pieszo {leg.metres} m"
                  + (f" ({leg.from_stop} → {leg.to_stop})" if leg.from_stop else ""))
        else:
            print(f"  {hhmm(leg.start)}–{hhmm(leg.end)}  {leg.kind} {leg.line}: {leg.from_stop} → {leg.to_stop}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
