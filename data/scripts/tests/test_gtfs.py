"""GTFS reader (gtfs_feed.py) and per-stop lines (etl_gtfs_przystanki.py) on a tiny synthetic feed.

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_gtfs_przystanki as etl  # noqa: E402
from gtfs_feed import Feed, StopTime, expand_frequencies, platform_parent, seconds  # noqa: E402

FILES = {
    "feed_info.txt": "feed_publisher_name,feed_version\nTest,2026-10-17\n",
    "routes.txt": "route_id,route_short_name,route_type\n160,160,3\n17,17,0\nM1,M1,1\nS1,S1,2\n",
    "calendar_dates.txt": "date,service_id,exception_type\n20261018,SUN,1\n20261019,MON,1\n20261019,MON_M,1\n",
    "stops.txt": ("stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station\n"
                  "700201,Centrum,52.2318,21.0060,0,\n700202,Centrum,52.2320,21.0065,0,\n"
                  "7014M,Centrum,52.2316,21.0105,1,\n7014M:P1,Centrum,52.2316,21.0105,0,7014M\n"
                  "7901,Warszawa Śródmieście,52.2290,21.0110,0,\n"),
    "trips.txt": ("trip_id,route_id,service_id\nbus1,160,MON\nbus2,160,MON\ntram1,17,MON\n"
                  "metro,M1,MON_M\nskm,S1,MON\nsunday,160,SUN\n"),
    "stop_times.txt": ("trip_id,stop_sequence,stop_id,arrival_time,departure_time\n"
                       "bus1,0,700201,08:00:00,08:00:00\nbus1,1,700202,08:03:00,08:03:00\n"
                       "bus2,0,700201,24:10:00,24:10:00\n"
                       "tram1,0,700202,08:05:00,08:05:00\n"
                       "metro,0,7014M:P1,05:00:00,05:00:30\n"
                       "skm,0,7901,07:00:00,07:00:00\n"
                       "sunday,0,700201,09:00:00,09:00:00\n"),
    "frequencies.txt": "trip_id,start_time,end_time,headway_secs\nmetro,05:00:00,06:00:00,600\n",
}


@pytest.fixture
def feed(tmp_path):
    path = tmp_path / "warsaw.zip"
    with zipfile.ZipFile(path, "w") as z:
        for name, text in FILES.items():
            z.writestr(name, text)
    return Feed(path)


def test_times_past_midnight_and_frequency_runs():
    assert seconds("24:10:00") == 87000
    template = [StopTime("metro", 0, "A", 18000, 18030), StopTime("metro", 1, "B", 18120, 18150)]
    runs = expand_frequencies(template, [(18000, 19800, 600)])
    # GTFS: start_time is when the first run departs the first stop.
    assert [r[0].departure for r in runs] == [18000, 18600, 19200]
    assert runs[1][1].arrival - runs[1][0].departure == 90  # travel time kept


def test_feed_reads_days_trips_and_platform_parents(feed):
    assert feed.service_dates()["20261019"] == {"MON", "MON_M"}
    assert feed.routes()["M1"].mode == "metro"
    assert set(feed.trips({"MON"})) == {"bus1", "bus2", "tram1", "skm"}
    stops = feed.stops()
    assert platform_parent(stops, "7014M:P1") == "7014M"
    assert platform_parent(stops, "700201") == "700201"


def test_first_weekday_skips_weekend():
    assert etl.first_weekday(["20261018", "20261017", "20261019"]) == "20261019"


def test_lines_and_departures_per_stop_for_one_day(feed):
    served, departures, routes = etl.lines_per_stop(feed, "20261019")
    assert served["700201"] == {"160"}  # the Sunday trip does not count
    assert departures["700201"] == 2
    assert etl.describe(served["700202"], routes) == (["17", "160"], ["autobus", "tramwaj"])
    assert departures["7014M:P1"] == 6  # one template, six runs every 10 min
    with pytest.raises(ValueError):
        etl.lines_per_stop(feed, "20261231")
