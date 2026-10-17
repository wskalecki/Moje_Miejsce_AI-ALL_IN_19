#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["shapely>=2.1", "pyproj>=3.6"]
# ///
"""Hourly road congestion proxy from the ZTM timetable (GTFS) → traffic.json per area.

Method (schedule-based, no invented values):
  1. Feed: https://mkuran.pl/gtfs/warsaw.zip (ZTM Warszawa data, GTFS by M. Kuranowski,
     bus shapes © OpenStreetMap). One representative weekday (default: the first
     Wednesday in the feed), buses + trams only (route_type 3 / 0).
  2. Every pair of consecutive stops of every trip near the featured areas is a
     segment; its geometry is the trip's shape cut between the two stops'
     shape_dist_traveled. ZTM times are rounded to full minutes, so a single hop
     (often "1 min") cannot show a slowdown; the scheduled speed of a pair is measured
     over a window of up to 2 hops on each side (≈5 hops, 5–8 min of running time):
     shape distance / (arrival at window end − departure at window start). Per
     segment and hour of departure: Σdistance / Σtime over all trips.
  3. Segment congestion per hour = 1 − v_h / v_max, where v_max is the fastest hour
     of that segment over the day (hours with ≥ 2 trips only). It is
     relative to the same segment, so bus and tram segments on one street are
     comparable.
  4. Map-matching: the segment line is sampled every 10 m; each sample is snapped to
     the nearest road centre line (roads-lines.geojson) within 25 m whose direction
     differs by < 35°. A way gets the segment if ≥ 15 m of it is covered.
  5. Way value per hour = mean of its segments' congestion weighted by covered
     length × trips. Ways without transit service → null for all hours (UI: neutral).
  6. Area curve: median over ways with data, per hour (+ median scheduled speed).

Output: application/public/data/3d/<msiId>/traffic.json
  {hours:[0..23], ways:{way_id:[24 × value|null]}, area:{median:[…], speedKmh:[…],
   ways:[…]}, method, source, serviceDate}

This is ZTM's PLANNED slowdown (timetable running times by time of day), not live
traffic: no cars-only streets, no incidents, no day-to-day variation.

Run: uv run data/scripts/osm3d/build_traffic.py [--gtfs data/raw/gtfs/warsaw.zip] [--date YYYYMMDD]
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import statistics
import sys
import time
import urllib.request
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

from shapely import STRtree
from shapely.geometry import LineString, Point, box, shape
from shapely.ops import substring

sys.path.insert(0, str(Path(__file__).parent))
from common import OUT_ROOT, REPO, featured_zones, to_m, to_wgs  # noqa: E402,F401

GTFS_URL = "https://mkuran.pl/gtfs/warsaw.zip"
GTFS_PATH = REPO / "data" / "raw" / "gtfs" / "warsaw.zip"
MODES = {"0": "tram", "3": "bus"}
STOP_MARGIN_DEG = 0.02  # ~1.4-2.2 km around zone bboxes (room for the time window)
MATCH_RADIUS_M = 25
MAX_ANGLE_DEG = 35
SAMPLE_STEP_M = 10
MIN_COVER_M = 15
MIN_TRIPS = 2  # night lines run every 30 min
WINDOW_HOPS = 2
MAX_PLAUSIBLE_KMH = 80


def rows(zf: zipfile.ZipFile, name: str):
    with zf.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))


def secs(t: str) -> int:
    h, m, s = t.split(":")
    return int(h) * 3600 + int(m) * 60 + int(s)


def pick_date(zf, wanted: str | None) -> tuple[str, set[str]]:
    by_date: dict[str, set[str]] = defaultdict(set)
    for r in rows(zf, "calendar_dates.txt"):
        if r["exception_type"] == "1":
            by_date[r["date"]].add(r["service_id"])
    if wanted:
        return wanted, by_date[wanted]
    for d in sorted(by_date):
        if date(int(d[:4]), int(d[4:6]), int(d[6:])).weekday() == 2:  # Wednesday
            return d, by_date[d]
    raise SystemExit("no Wednesday in feed")


def bearing(a, b) -> float:
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])) % 180  # undirected


def angle_diff(a: float, b: float) -> float:
    d = abs(a - b) % 180
    return min(d, 180 - d)


class AreaMatcher:
    """Snaps segment geometry (EPSG:2180) to the area's road centre lines."""

    def __init__(self, lines_path: Path):
        fc = json.loads(lines_path.read_text())
        self.geoms, self.way = [], []
        for f in fc["features"]:
            self.geoms.append(to_m(shape(f["geometry"])))
            self.way.append(f["properties"]["way_id"])
        self.tree = STRtree(self.geoms)

    def match(self, seg: LineString) -> dict[int, float]:
        cover: dict[int, float] = defaultdict(float)
        n = max(1, int(seg.length // SAMPLE_STEP_M))
        for k in range(n):
            d = (k + 0.5) * seg.length / n
            p = seg.interpolate(d)
            q = seg.interpolate(min(d + 2, seg.length)); o = seg.interpolate(max(d - 2, 0))
            seg_b = bearing((o.x, o.y), (q.x, q.y))
            best, best_d = None, MATCH_RADIUS_M
            for i in self.tree.query(p.buffer(MATCH_RADIUS_M)):
                g = self.geoms[i]
                dist = g.distance(p)
                if dist >= best_d:
                    continue
                t = g.project(p)
                a = g.interpolate(max(t - 2, 0)); b = g.interpolate(min(t + 2, g.length))
                if angle_diff(seg_b, bearing((a.x, a.y), (b.x, b.y))) > MAX_ANGLE_DEG:
                    continue
                best, best_d = i, dist
            if best is not None:
                cover[self.way[best]] += seg.length / n
        return {w: c for w, c in cover.items() if c >= MIN_COVER_M}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gtfs", type=Path, default=GTFS_PATH)
    ap.add_argument("--date", help="service date YYYYMMDD (default: first Wednesday in feed)")
    args = ap.parse_args()
    if not args.gtfs.exists():
        print(f"downloading {GTFS_URL} …")
        args.gtfs.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(GTFS_URL, args.gtfs)
    zf = zipfile.ZipFile(args.gtfs)
    feed_version = next(rows(zf, "feed_info.txt"))["feed_version"]
    day, services = pick_date(zf, args.date)
    print(f"feed {feed_version}, service date {day}: {sorted(services)}")

    zones = featured_zones()
    w = min(z["bbox"][0] for z in zones) - STOP_MARGIN_DEG
    s = min(z["bbox"][1] for z in zones) - STOP_MARGIN_DEG
    e = max(z["bbox"][2] for z in zones) + STOP_MARGIN_DEG
    n = max(z["bbox"][3] for z in zones) + STOP_MARGIN_DEG
    near = {r["stop_id"] for r in rows(zf, "stops.txt")
            if w <= float(r["stop_lon"]) <= e and s <= float(r["stop_lat"]) <= n}
    route_mode = {r["route_id"]: MODES[r["route_type"]] for r in rows(zf, "routes.txt") if r["route_type"] in MODES}
    trips = {r["trip_id"]: (r["shape_id"], route_mode[r["route_id"]]) for r in rows(zf, "trips.txt")
             if r["service_id"] in services and r["route_id"] in route_mode}
    print(f"{len(near)} stops near areas, {len(trips)} bus/tram trips")

    t0 = time.time()
    per_trip: dict[str, list[tuple[int, str, int, int, float]]] = defaultdict(list)
    for r in rows(zf, "stop_times.txt"):
        if r["stop_id"] in near and r["trip_id"] in trips:
            per_trip[r["trip_id"]].append((int(r["stop_sequence"]), r["stop_id"], secs(r["arrival_time"]),
                                           secs(r["departure_time"]), float(r["shape_dist_traveled"] or 0)))
    print(f"stop_times scanned in {time.time() - t0:.0f} s, {len(per_trip)} trips touch the areas")

    # segment key → per-hour [Σdist_km, Σtime_s, trips]
    seg_stats: dict[tuple, list[list[float]]] = {}
    seg_mode: dict[tuple, str] = {}
    for trip_id, sts in per_trip.items():
        shape_id, mode = trips[trip_id]
        sts.sort()
        # split into runs of consecutive stop_sequence (gaps = stops outside the margin)
        runs, cur = [], [sts[0]]
        for a, b in zip(sts, sts[1:]):
            if b[0] == a[0] + 1 and b[4] > a[4]:
                cur.append(b)
            else:
                runs.append(cur); cur = [b]
        runs.append(cur)
        for run in runs:
            for i in range(len(run) - 1):
                a, b = run[i], run[i + 1]
                # time window: up to WINDOW_HOPS hops on each side of the pair, so that the
                # minute-rounded ZTM times are measured over ~5 hops instead of one
                lo, hi = max(0, i - WINDOW_HOPS), min(len(run) - 1, i + 1 + WINDOW_HOPS)
                dist_km = run[hi][4] - run[lo][4]
                dt = run[hi][2] - run[lo][3]
                if dt <= 0 or dist_km <= 0:
                    continue
                key = (shape_id, a[1], b[1], round(a[4], 4), round(b[4], 4))
                st = seg_stats.setdefault(key, [[0.0, 0.0, 0] for _ in range(24)])
                h = (a[3] // 3600) % 24
                st[h][0] += dist_km; st[h][1] += dt; st[h][2] += 1
                seg_mode[key] = mode
    print(f"{len(seg_stats)} distinct stop-to-stop segments")

    need_shapes = {k[0] for k in seg_stats}
    pts: dict[str, list[tuple[float, float, float]]] = defaultdict(list)
    for r in rows(zf, "shapes.txt"):
        if r["shape_id"] in need_shapes:
            pts[r["shape_id"]].append((int(r["shape_pt_sequence"]), float(r["shape_pt_lon"]),
                                       float(r["shape_pt_lat"]), float(r["shape_dist_traveled"])))
    shape_m: dict[str, tuple[LineString, float]] = {}
    for sid, p in pts.items():
        p.sort()
        line = to_m(LineString([(x, y) for _, x, y, _ in p]))
        shape_m[sid] = (line, p[-1][3])  # metric line, total km in GTFS units

    # per segment: congestion per hour
    seg_cg: dict[tuple, list[float | None]] = {}
    seg_speed: dict[tuple, list[float | None]] = {}
    for key, st in seg_stats.items():
        sp = [(d / t * 3600) if (c >= MIN_TRIPS and t > 0) else None for d, t, c in st]
        sp = [v if v is not None and v <= MAX_PLAUSIBLE_KMH else None for v in sp]
        valid = [v for v in sp if v is not None]
        if len(valid) < 2:
            continue
        vmax = max(valid)
        seg_cg[key] = [None if v is None else max(0.0, 1 - v / vmax) for v in sp]
        seg_speed[key] = sp

    for z in zones:
        out_dir = OUT_ROOT / z["id"]
        matcher = AreaMatcher(out_dir / "roads-lines.geojson")
        zone_box = box(*to_m(box(*z["bbox"])).bounds).buffer(50)
        acc = defaultdict(lambda: [[0.0, 0.0] for _ in range(24)])  # way → hour → [Σw·cg, Σw]
        acc_speed = defaultdict(lambda: [[0.0, 0.0] for _ in range(24)])
        modes = defaultdict(set)
        n_seg = 0
        for key, cg in seg_cg.items():
            line, total_km = shape_m.get(key[0], (None, 0))
            if line is None or total_km <= 0:
                continue
            f = line.length / total_km  # metres per GTFS km (≈1000)
            seg = substring(line, key[3] * f, key[4] * f)
            if seg.is_empty or seg.length < 20 or not seg.intersects(zone_box):
                continue
            cover = matcher.match(seg)
            if not cover:
                continue
            n_seg += 1
            st = seg_stats[key]
            for way, length in cover.items():
                modes[way].add(seg_mode[key])
                for h in range(24):
                    if cg[h] is None:
                        continue
                    wgt = length * st[h][2]
                    acc[way][h][0] += wgt * cg[h]; acc[way][h][1] += wgt
                    acc_speed[way][h][0] += wgt * seg_speed[key][h]; acc_speed[way][h][1] += wgt
        ways_out, speeds = {}, {}
        for way, hs in acc.items():
            vals = [round(a / b, 3) if b > 0 else None for a, b in hs]
            if all(v is None for v in vals):
                continue
            ways_out[str(way)] = vals
            speeds[way] = [a / b if b > 0 else None for a, b in acc_speed[way]]
        all_ways = {f for f in matcher.way}
        median = []
        speed_med = []
        n_with = []
        for h in range(24):
            vs = [v[h] for v in ways_out.values() if v[h] is not None]
            sv = [v[h] for v in speeds.values() if v[h] is not None]
            median.append(round(statistics.median(vs), 3) if vs else None)
            speed_med.append(round(statistics.median(sv), 1) if sv else None)
            n_with.append(len(vs))
        doc = {
            "hours": list(range(24)),
            "ways": dict(sorted(ways_out.items(), key=lambda kv: int(kv[0]))),
            "area": {"median": median, "speedKmh": speed_med, "ways": n_with},
            "serviceDate": f"{day[:4]}-{day[4:6]}-{day[6:]}",
            "method": (
                "Schedule-based congestion proxy: ZTM timetable running times of buses and trams on "
                "one weekday; scheduled speed per consecutive stop pair and hour, measured over a "
                "window of +-2 stops to beat minute rounding (sum of shape distance / sum of "
                "scheduled time, >=2 trips), congestion = "
                "1 - speed_h / max hourly speed of that segment; segments map-matched to road "
                "centre lines (<=25 m, direction <35 deg, >=15 m overlap), per way weighted by "
                "overlap x trips. null = no transit on that way or too few trips in that hour. "
                "This is ZTM's planned slowdown, not live traffic."
            ),
            "source": (f"ZTM Warszawa GTFS via mkuran.pl ({GTFS_URL}), feed {feed_version}; "
                       "road geometry © OpenStreetMap contributors (ODbL)"),
            "modes": {m: sum(1 for v in modes.values() if m in v) for m in ("bus", "tram")},
            "waysTotal": len(all_ways),
        }
        path = out_dir / "traffic.json"
        path.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
        peak = {h: median[h] for h in (8, 12, 17)}
        print(f"{z['id']}: {len(ways_out)}/{len(all_ways)} ways with data from {n_seg} segments, "
              f"median cg 8h/12h/17h = {peak}, file {path.stat().st_size / 1e3:.0f} KB")
        print("  median:", median)
        print("  speed :", speed_med)


if __name__ == "__main__":
    main()
