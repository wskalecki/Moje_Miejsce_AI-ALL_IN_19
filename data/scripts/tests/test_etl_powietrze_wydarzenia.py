"""Air quality and events ETL → POI schema (docs/data/poi-schema.md).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_powietrze  # noqa: E402
import etl_wydarzenia  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()


def station(lon=21.080555, lat=52.245703, code="PM2.5", **over):
    base = {"name": "Warszawa-Grochowska", "lon": lon, "lat": lat, "station_type": "Punkt pomiaru",
            "owner": "Urząd m.st. Warszawy", "ijp": {"name": "Bardzo dobry"},
            "data": [{"param_code": code, "value": 9.10401, "unit": "µg/m3", "time": "2026-10-17 14:00:00"},
                     {"param_code": "PM10", "value": 10.3272, "unit": "µg/m3", "time": "2026-10-17 14:00:00"}]}
    return base | over


def test_air_sensor_schema_and_both_pm25_codes():
    for code in ("PM2.5", "PM25"):
        p = etl_powietrze.normalize(station(code=code), DISTRICTS)["properties"]
        assert (p["category"], p["subtype"]) == ("environment", "air_sensor")
        assert p["meta"]["pm25"] == 9.1
        assert p["meta"]["no2"] is None  # not measured → null, not 0
        assert p["meta"]["czas_pomiaru"] == "2026-10-17T14:00:00"
        assert p["cell_id"] == assign_cell(21.080555, 52.245703)
        assert p["district"] == "Praga-Południe"


def test_air_sensor_outside_warsaw_is_kept_and_tagged():
    p = etl_powietrze.normalize(station(lon=20.65, lat=52.43, name="Nowy Dwór"), DISTRICTS)["properties"]
    assert p["district"] is None
    assert "poza_warszawa" in p["tags"]


def reading_at(hour, pm25, code="PM2.5"):
    return station(code=code, data=[{"param_code": code, "value": pm25, "unit": "µg/m3",
                                     "time": f"2026-10-{hour // 24 + 10:02d} {hour % 24:02d}:00:00"}])


def test_history_appends_each_station_hour_once(tmp_path):
    path = tmp_path / "history.jsonl"
    assert etl_powietrze.append_history([reading_at(5, 10.0)], path) == 1
    assert etl_powietrze.append_history([reading_at(5, 10.0)], path) == 0  # same hour again
    assert etl_powietrze.append_history([reading_at(6, 20.0, code="PM25")], path) == 1
    [rows] = etl_powietrze.load_history(path).values()
    assert [v["pm25"] for _, v in rows] == [10.0, 20.0]


def test_averages_per_window_with_reading_counts(tmp_path):
    path = tmp_path / "history.jsonl"
    # Hourly 10 µg/m³ for the last 24 h, plus 40 µg/m³ three days earlier.
    etl_powietrze.append_history([reading_at(h, 10.0) for h in range(100, 124)] + [reading_at(50, 40.0)], path)
    history = etl_powietrze.load_history(path)
    p = etl_powietrze.normalize(station(), DISTRICTS, history)["properties"]
    day, week = p["meta"]["srednie"]["24h"], p["meta"]["srednie"]["7d"]
    assert (day["pm25"], day["n_pm25"]) == (10.0, 24)
    assert (week["pm25"], week["n_pm25"]) == (11.2, 25)  # (24 × 10 + 40) / 25
    assert day["no2"] is None and day["n_no2"] == 0
    assert p["meta"]["srednie_do"] == "2026-10-15T03:00:00"


def test_no_history_means_no_averages():
    p = etl_powietrze.normalize(station(), DISTRICTS)["properties"]
    assert p["meta"]["srednie"] is None


def event(features=1, **over):
    point = {"geometry": {"type": "Point", "coordinates": [20.98, 52.2142]},
             "properties": {"shortStreetName": "ul. Grójecka", "streetNumber": "65"}}
    base = {"title": "Oskarżony", "url": "https://kultura.um.warszawa.pl/-/oskarzony",
            "address": [{"name": "OCH-Teatr"}], "category": [{"name": "Kultura"}],
            "occurrence": [{"from": "2027-01-29T19:00:00+01", "to": "2027-01-29T21:00:00+01"},
                           {"from": "2026-12-06T11:00:00+01", "to": "2026-12-06T14:00:00+01"}],
            "map": {"features": [point] * features}}
    return base | over


def test_event_schema_dates_and_stable_id():
    [poi] = etl_wydarzenia.normalize(event(), DISTRICTS)
    p = poi["properties"]
    assert (p["category"], p["subtype"], p["name"]) == ("culture", "event", "Oskarżony")
    assert p["sourceId"] == etl_wydarzenia.normalize(event(), DISTRICTS)[0]["properties"]["sourceId"]
    assert p["meta"]["pierwszy_termin"] == "2026-12-06T11:00:00+01:00"
    assert p["meta"]["ostatni_termin"] == "2027-01-29T21:00:00+01:00"
    assert p["meta"]["adres"] == "ul. Grójecka 65"
    assert p["tags"] == ["Kultura"]
    assert p["district"] == "Ochota"


def test_event_with_many_venues_and_without_point():
    ids = [p["id"] for p in etl_wydarzenia.normalize(event(features=3), DISTRICTS)]
    assert len(set(ids)) == 3
    assert etl_wydarzenia.normalize(event(map=None), DISTRICTS) == []


def test_iso_offsets():
    assert etl_wydarzenia.iso("2027-01-29T19:00:00+01") == "2027-01-29T19:00:00+01:00"
    assert etl_wydarzenia.iso("bzdura") is None
