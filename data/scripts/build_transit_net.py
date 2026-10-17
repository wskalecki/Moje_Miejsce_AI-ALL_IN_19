#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""Compact public-transport network for the in-browser "Dojazd do…" filter.

The app computes, for a clicked point or a workplace address, the travel time from every grid cell
with the same reverse Connection Scan as transit_router.py / etl_czasy_przejazdu.py (arrival
ARRIVE_FROM–ARRIVE_TO every STEP_MIN minutes on DAY, mean over the reachable deadlines). This script
exports exactly the connections that scan can use (departure >= first deadline − MAX_RIDE_S,
arrival <= last deadline), the stop positions and the grid cell centres, as typed arrays.

Outputs (committed, loaded only when the filter is switched on):
  application/public/data/transit/commute-net.bin   little-endian typed arrays, see `layout` in the meta
  application/public/data/transit/commute-net.json  meta: day, feed, deadlines, constants, layout

    uv run data/scripts/build_transit_net.py
"""

from __future__ import annotations

import json
import sys
import zipfile
from array import array
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from etl_czasy_przejazdu import DAY, deadlines  # noqa: E402
from generate_grid import GRID_VERSION, WARSAW_BBOX, generate_grid  # noqa: E402
from gtfs_feed import ATTRIBUTION, FEED_PATH  # noqa: E402
from transit_network import network_for  # noqa: E402
from transit_router import ACCESS_M, DETOUR, MAX_RIDE_S, MIN_TRANSFER_S, TRANSFER_M, WALK_MPS  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "application/public/data/transit"


def feed_version() -> str | None:
    if not FEED_PATH.exists():
        return None
    with zipfile.ZipFile(FEED_PATH) as z:
        if "feed_info.txt" not in z.namelist():
            return None
        header, row = z.read("feed_info.txt").decode("utf-8-sig").splitlines()[:2]
        return dict(zip(header.split(","), row.split(","))).get("feed_version")


def main() -> int:
    net = network_for(DAY)
    dl = deadlines()
    start, end = dl[0] - MAX_RIDE_S, dl[-1]
    conns = [c for c in net.connections if c.dep >= start and c.arr <= end]  # already sorted by (dep, arr)
    modes = sorted(set(net.route_modes))
    mode_of = {name: i for i, name in enumerate(modes)}
    cells = generate_grid(*WARSAW_BBOX, warsaw_only=True)["features"]

    arrays: list[tuple[str, str, array]] = [  # 8-, 4-, 2-, 1-byte arrays in this order keep views aligned
        ("stopLon", "d", array("d", net.lons)),
        ("stopLat", "d", array("d", net.lats)),
        ("cellLon", "d", array("d", (f["properties"]["center"][0] for f in cells))),
        ("cellLat", "d", array("d", (f["properties"]["center"][1] for f in cells))),
        ("trip", "I", array("I", (c.trip for c in conns))),
        ("depStop", "H", array("H", (c.dep_stop for c in conns))),
        ("arrStop", "H", array("H", (c.arr_stop for c in conns))),
        ("dep", "H", array("H", (c.dep - start for c in conns))),
        ("arr", "H", array("H", (c.arr - start for c in conns))),
        ("cellRow", "H", array("H", (f["properties"]["row"] for f in cells))),
        ("cellCol", "H", array("H", (f["properties"]["col"] for f in cells))),
        ("mode", "B", array("B", (mode_of[net.route_modes[c.route]] for c in conns))),
    ]
    if sys.byteorder != "little":
        for _, _, a in arrays:
            a.byteswap()
    js_type = {"d": "Float64", "I": "Uint32", "H": "Uint16", "B": "Uint8"}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUT_DIR / "commute-net.bin").open("wb") as f:
        for _, _, a in arrays:
            a.tofile(f)
    meta = {
        "schemaVersion": 1,
        "gridVersion": GRID_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "script": "data/scripts/build_transit_net.py",
        "day": DAY,
        "feedVersion": feed_version(),
        "source": ATTRIBUTION,
        "start": start,
        "deadlines": dl,
        "modes": modes,
        "counts": {"stops": len(net.lons), "connections": len(conns), "cells": len(cells)},
        "constants": {"WALK_MPS": WALK_MPS, "DETOUR": DETOUR, "ACCESS_M": ACCESS_M, "TRANSFER_M": TRANSFER_M,
                      "MIN_TRANSFER_S": MIN_TRANSFER_S, "MAX_RIDE_S": MAX_RIDE_S},
        "layout": [{"name": n, "type": js_type[t], "length": len(a)} for n, t, a in arrays],
    }
    (OUT_DIR / "commute-net.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    size = (OUT_DIR / "commute-net.bin").stat().st_size
    print(f"{len(conns)} of {len(net.connections)} connections, {len(net.lons)} stops, {len(cells)} cells, "
          f"{size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
