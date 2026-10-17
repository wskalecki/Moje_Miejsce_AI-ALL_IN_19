#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""Average public transport travel times from every grid cell to chosen destinations, per mode.

For each destination, mode and arrival deadline (ARRIVE_FROM–ARRIVE_TO every STEP_MIN minutes on a
weekday) one reverse Connection Scan (transit_router.Router.latest_departures) gives the latest time
to leave every cell centre and still arrive. Travel time = deadline − latest leave, so it includes
walking, waiting at transfers and the ride, but not waiting for the first vehicle. Per cell it stores
[mean, min, max, n] in minutes over the deadlines, n being how many deadlines were reachable.

Modes: `wszystkie` (any vehicle) and each single mode (`autobus`, `tramwaj`, `metro`, `kolej`) with
walking only. Walking the whole way counts in every mode when it is short enough (≤ 1.6 km).

Output: data/grid/czasy_przejazdu.json, keyed by cell_id of the team grid (generate_grid.py), and
data/grid/czasy_przejazdu.geojson with the same values on each cell polygon (`properties.t`) for the map.

    uv run data/scripts/etl_czasy_przejazdu.py
    uv run data/scripts/etl_czasy_przejazdu.py --cel praca "Biuro" 21.01 52.23 --sprawdz 30
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from generate_grid import CELL_SIZE_M, GRID_VERSION, WARSAW_BBOX, generate_grid
from gtfs_feed import ATTRIBUTION
from poi_common import write_collection
from transit_network import network_for
from transit_router import ACCESS_M, DETOUR, MIN_TRANSFER_S, TRANSFER_M, WALK_MPS, Router, hhmm, parse_hhmm
from um_api import DATA_DIR

OUT_PATH = DATA_DIR / "grid" / "czasy_przejazdu.json"
DAY = "20261019"
ARRIVE_FROM, ARRIVE_TO, STEP_MIN = "07:30", "09:00", 10
MODES: dict[str, set[str] | None] = {
    "wszystkie": None,
    "autobus": {"autobus"},
    "tramwaj": {"tramwaj"},
    "metro": {"metro"},
    "kolej": {"kolej"},
}
DEFAULT_TARGETS = {
    "centrum": ("Centrum (Rondo Dmowskiego)", 21.0122, 52.2297),
    "rondo_daszynskiego": ("Rondo Daszyńskiego (biurowce Woli)", 20.9830, 52.2300),
    "sluzewiec": ("Służewiec (biurowce, Domaniewska)", 21.0010, 52.1800),
}


def deadlines() -> list[int]:
    return list(range(parse_hhmm(ARRIVE_FROM), parse_hhmm(ARRIVE_TO) + 1, STEP_MIN * 60))


def summarize(minutes: list[float]) -> list[float | int] | None:
    if not minutes:
        return None
    return [round(sum(minutes) / len(minutes), 1), round(min(minutes), 1), round(max(minutes), 1), len(minutes)]


def travel_times(router: Router, cells: list[tuple[str, tuple[float, float]]], target: tuple[float, float],
                 modes: set[str] | None, access: dict[str, list]) -> dict[str, list | None]:
    per_cell: dict[str, list[float]] = {cid: [] for cid, _ in cells}
    for deadline in deadlines():
        board = router.latest_departures(target, deadline, modes)
        for cid, centre in cells:
            leave = router.latest_leave(centre, board, target, deadline, access[cid])
            if leave is not None:
                per_cell[cid].append((deadline - leave) / 60)
    return {cid: summarize(m) for cid, m in per_cell.items()}


def check(router: Router, cells: list, targets: dict, samples: int) -> int:
    """Forward-route random cells at the computed leave time: they must arrive by the deadline."""
    rng = random.Random(1)
    bad = 0
    for _ in range(samples):
        cid, centre = rng.choice(cells)
        tid = rng.choice(list(targets))
        target = targets[tid][1:]
        deadline = rng.choice(deadlines())
        leave = router.latest_leave(centre, router.latest_departures(target, deadline), target, deadline)
        if leave is None:
            continue
        j = router.route(centre, target, int(leave))
        if j is None or j.arrival > deadline:
            bad += 1
            print(f"  NIEZGODNE: {cid} → {tid}, przyjazd {hhmm(deadline)}, wyjście {hhmm(leave)}, "
                  f"w przód: {hhmm(j.arrival) if j else 'brak'}", file=sys.stderr)
    return bad


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--cel", nargs=4, action="append", metavar=("ID", "NAZWA", "LON", "LAT"),
                        help="destination (repeatable); default: three office hubs")
    parser.add_argument("--day", default=DAY, help="service day YYYYMMDD")
    parser.add_argument("--sprawdz", type=int, default=0, metavar="N", help="cross-check N random results")
    parser.add_argument("-o", "--output", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    targets = {c[0]: (c[1], float(c[2]), float(c[3])) for c in args.cel} if args.cel else DEFAULT_TARGETS
    started = time.time()
    router = Router(network_for(args.day))
    grid = generate_grid(*WARSAW_BBOX, warsaw_only=True)
    cells = [(f["properties"]["id"], tuple(f["properties"]["center"])) for f in grid["features"]]
    access = {cid: router.stops_near(*centre, ACCESS_M) for cid, centre in cells}
    print(f"siatka: {len(cells)} komórek, sieć: {len(router.net.connections)} połączeń ({time.time() - started:.0f} s)")

    results: dict[str, dict[str, dict[str, list | None]]] = {cid: {} for cid, _ in cells}
    for tid, (name, lon, lat) in targets.items():
        for mode, allowed in MODES.items():
            t = time.time()
            times = travel_times(router, cells, (lon, lat), allowed, access)
            reached = sum(v is not None for v in times.values())
            for cid, value in times.items():
                results[cid].setdefault(tid, {})[mode] = value
            print(f"  {tid:20} {mode:10} osiągalne z {reached:5} komórek ({time.time() - t:.0f} s)")

    if args.sprawdz:
        bad = check(router, cells, targets, args.sprawdz)
        print(f"sprawdzenie w przód: {args.sprawdz - bad}/{args.sprawdz} zgodnych")

    out = {
        "schemaVersion": 1,
        "gridVersion": GRID_VERSION,
        "cellSizeM": CELL_SIZE_M,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "dzien": args.day,
        "przyjazd": {"od": ARRIVE_FROM, "do": ARRIVE_TO, "co_min": STEP_MIN, "terminow": len(deadlines())},
        "wartosci": ["srednia_min", "min_min", "max_min", "osiagalne_terminy"],
        "zalozenia": {"chod_m_s": WALK_MPS, "objazd": DETOUR, "dojscie_max_m": ACCESS_M,
                      "przesiadka_pieszo_max_m": TRANSFER_M, "przesiadka_min_s": MIN_TRANSFER_S},
        "zrodlo": ATTRIBUTION,
        "cele": {tid: {"nazwa": n, "lon": lon, "lat": lat} for tid, (n, lon, lat) in targets.items()},
        "tryby": list(MODES),
        "cells": results,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    features = [
        {
            "type": "Feature",
            "id": f["properties"]["id"],
            "geometry": {"type": "Polygon", "coordinates": [[[round(x, 6), round(y, 6)] for x, y in ring]
                                                            for ring in f["geometry"]["coordinates"]]},
            "properties": {"id": f["properties"]["id"], "district": f["properties"].get("district"),
                           "t": results[f["properties"]["id"]]},
        }
        for f in grid["features"]
    ]
    meta = {k: v for k, v in out.items() if k != "cells"}
    geo_path = args.output.with_suffix(".geojson")
    write_collection(geo_path, features, extra={"metadata": meta})
    for path in (args.output, geo_path):
        print(f"OK: {path.relative_to(DATA_DIR.parent)} ({path.stat().st_size / 1e6:.1f} MB)")
    print(f"czas całkowity: {time.time() - started:.0f} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
