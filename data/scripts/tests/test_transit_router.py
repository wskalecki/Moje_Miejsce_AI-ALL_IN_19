"""Connection Scan routing (transit_router.py) and network cache (transit_network.py).

Synthetic line along a parallel: stops A–B–C–D every ~1.37 km (0.02° lon at 52.2°N),
a bus A→C and a faster tram B→D, plus a stop E 300 m from C for walking transfers.

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import transit_network as tn  # noqa: E402
from transit_router import MIN_TRANSFER_S, Router, walk_s  # noqa: E402
from transit_router import metres as dist  # noqa: E402

LAT = 52.2
LON = {"A": 21.00, "B": 21.02, "C": 21.04, "D": 21.06, "E": 21.04 + 300 / (111_320 * 0.6129)}
H8 = 8 * 3600


def net(connections):
    ids = list(LON)
    return tn.Network(
        day="20261019", stop_ids=ids, stop_names=ids, lons=[LON[s] for s in ids], lats=[LAT] * len(ids),
        route_names=["100", "17", "M1"], route_modes=["autobus", "tramwaj", "metro"],
        connections=sorted((tn.Connection(*c) for c in connections), key=lambda c: (c.dep, c.arr)),
    )


S = {s: i for i, s in enumerate(LON)}
BUS = [(S["A"], S["B"], H8 + 300, H8 + 600, 0, 0), (S["B"], S["C"], H8 + 600, H8 + 900, 0, 0)]
TRAM = [(S["B"], S["D"], H8 + 720, H8 + 960, 1, 1)]
# Bus reaches C at 08:15; walking 300 m to E takes 300 s, so the 08:21 metro is the first one catchable.
METRO_FROM_E = [(S["E"], S["D"], H8 + 1260, H8 + 1320, 2, 2)]


def at(stop, dlon_m=0.0):
    return (LON[stop] + dlon_m / (111_320 * 0.6129), LAT)


def test_single_ride_with_access_and_egress_walks():
    j = Router(net(BUS)).route(at("A", -200), at("C", 100), H8)
    kinds = [leg.kind for leg in j.legs]
    assert kinds == ["pieszo", "autobus", "pieszo"]
    assert j.legs[1].line == "100" and (j.legs[1].from_stop, j.legs[1].to_stop) == ("A", "C")
    assert j.arrival == H8 + 900 + walk_s(100)
    assert j.transfers == 0


def test_transfer_needs_minimum_time_at_the_same_stop():
    # Bus reaches B at 08:10, tram leaves B at 08:12: 120 s ≥ 60 s, so the change works.
    j = Router(net(BUS + TRAM)).route(at("A"), at("D"), H8)
    assert [(leg.kind, leg.line) for leg in j.legs if leg.kind != "pieszo"] == [("autobus", "100"), ("tramwaj", "17")]
    assert j.arrival == H8 + 960 and j.transfers == 1
    # Tram leaving 30 s after the bus arrives is missed.
    tight = [(S["B"], S["D"], H8 + 600 + MIN_TRANSFER_S // 2, H8 + 840, 1, 1)]
    assert Router(net(BUS + tight)).route(at("A"), at("D"), H8) is None


def test_walking_transfer_between_nearby_stops():
    j = Router(net(BUS + METRO_FROM_E)).route(at("A"), at("D"), H8)
    walk = [leg for leg in j.legs if leg.kind == "pieszo" and leg.from_stop]
    assert walk and (walk[0].from_stop, walk[0].to_stop) == ("C", "E")
    assert j.legs[-2].kind == "metro"
    early = [(S["E"], S["D"], H8 + 1140, H8 + 1200, 2, 2)]  # leaves before the walk ends
    assert Router(net(BUS + early)).route(at("A"), at("D"), H8) is None


def test_mode_filter_and_walk_only_fallback():
    r = Router(net(BUS + TRAM))
    only_tram = r.route(at("B"), at("D"), H8, modes={"tramwaj"})
    assert [leg.kind for leg in only_tram.legs] == ["pieszo", "tramwaj", "pieszo"]
    assert r.route(at("A"), at("D"), H8, modes={"metro"}) is None
    short = r.route(at("A"), at("A", 500), H8)  # 500 m: walking beats waiting for the bus
    assert [leg.kind for leg in short.legs] == ["pieszo"]
    assert short.arrival == H8 + walk_s(dist(*at("A"), *at("A", 500)))


def test_latest_departure_matches_forward_search():
    r = Router(net(BUS + TRAM + METRO_FROM_E))
    origin, target = at("A", -200), at("D", 50)
    for deadline in (H8 + 1100, H8 + 1400, H8 + 2000):
        board = r.latest_departures(target, deadline)
        leave = r.latest_leave(origin, board, target, deadline)
        j = r.route(origin, target, int(leave))
        assert j is not None and j.arrival <= deadline
        later = r.route(origin, target, int(leave) + 60)  # a minute later misses it
        assert later is None or later.arrival > deadline


def test_latest_departure_respects_modes_and_reachability():
    r = Router(net(BUS + TRAM))
    target = at("D")
    assert r.latest_leave(at("A"), r.latest_departures(target, H8 + 1000, {"autobus"}), target, H8 + 1000) is None
    assert r.latest_departures(target, H8 + 900) == {}  # tram arrives 08:16, deadline 08:15
    near = at("D", -600)  # walking only: 600 m
    assert r.latest_leave(near, {}, target, H8) == H8 - walk_s(dist(*near, *target))


def test_travel_time_summary_per_cell(monkeypatch):
    import etl_czasy_przejazdu as etl

    monkeypatch.setattr(etl, "deadlines", lambda: [H8 + 1100, H8 + 1400])
    r = Router(net(BUS + TRAM + METRO_FROM_E))
    cells = [("near_A", at("A", -200)), ("nowhere", (20.0, 51.0))]
    access = {cid: r.stops_near(*c, 800) for cid, c in cells}
    times = etl.travel_times(r, cells, at("D", 50), None, access)
    mean, low, high, n = times["near_A"]
    assert n == 2 and low <= mean <= high
    assert times["nowhere"] is None
    assert etl.summarize([10.0, 20.0, 30.0]) == [20.0, 10.0, 30.0, 3]


def test_network_cache_round_trip(tmp_path):
    original = net(BUS + TRAM)
    path = tmp_path / "siec.csv.gz"
    tn.save(original, path)
    loaded = tn.load(path)
    assert loaded.connections == original.connections
    assert loaded.stop_ids == original.stop_ids and loaded.route_modes == original.route_modes
