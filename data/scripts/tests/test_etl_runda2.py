"""Eco points, car parks, weather, participatory budget and tourist routes ETL.

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_budzet_obywatelski as bo  # noqa: E402
import etl_ekopunkty  # noqa: E402
import etl_parkingi  # noqa: E402
import etl_pogoda  # noqa: E402
import etl_trasy_turystyczne as trasy  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()


def day(**over):
    return {"calodobowo": False, "nieczynne": False, "otwarta_od": "08:00", "otwarta_do": "16:00"} | over


def test_eco_point_subtype_hours_and_no_contacts():
    raw = {"dlugosc": 21.11252, "szerokosc": 52.24348, "dzielnica": "Praga-Południe", "nazwa": "",
           "opis_lokalizacji": "teren Pływalni Szuwarek", "ulica": "ul. Biłgorajska", "ulica_numer": "2",
           "typ_punktu": [{"id": 6, "rodzaj": "Miejski Punkt Elektroodpadów"}],
           "mail": "x@example.com", "telefon": "123",
           "dni_pracy": [{d: day() for d in etl_ekopunkty.DAYS} | {"niedziela": day(nieczynne=True)}]}
    p = etl_ekopunkty.normalize(raw, DISTRICTS)["properties"]
    assert (p["category"], p["subtype"], p["name"]) == ("amenity", "e_waste", "Miejski Punkt Elektroodpadów")
    assert p["meta"]["godziny"]["poniedzialek"] == "08:00–16:00"
    assert p["meta"]["godziny"]["niedziela"] == "nieczynne"
    assert p["meta"]["calodobowo"] is False
    assert "x@example.com" not in json.dumps(p)
    assert p["district"] == "Praga-Południe"


def test_car_park_string_coordinates_and_snapshot():
    raw = {"name": "Parking na Pl. Żelaznej Bramy", "latitude": "52.239560", "longitude": "21.001779",
           "adress": "", "total_places": [{"level": "0", "standard": 47, "disabled": 0, "electric": 0}],
           "free_places_total": {"public": 2, "disabled": 0, "electric": 0}, "managerEmail": "a@b.pl"}
    poi = etl_parkingi.normalize(raw, "2026-10-17T15:30:01", DISTRICTS)
    p = poi["properties"]
    assert poi["geometry"]["coordinates"] == [21.001779, 52.23956]
    assert (p["subtype"], p["meta"]["miejsca"], p["meta"]["wolne"]) == ("parking", 47, 2)
    assert p["meta"]["stan_na"] == "2026-10-17T15:30:01"
    assert p["meta"]["adres"] is None
    assert "a@b.pl" not in json.dumps(p)


def test_weather_station_readings():
    raw = {"lokalizacja": "Stacja Bielany", "lat": 52.29241, "lon": 20.97288, "czas": "2026-10-17 15:10:00",
           "temp_pow": 14.6, "temp_naw": 23.3, "wilg_pow": 45.0, "pred_wiatru": 1.0, "kier_wiatru": 240.0,
           "int_opadu": None}
    p = etl_pogoda.normalize(raw, DISTRICTS)["properties"]
    assert (p["category"], p["subtype"]) == ("environment", "weather_station")
    assert p["meta"]["temperatura_nawierzchni"] == 23.3
    assert p["meta"]["opad"] is None
    assert p["meta"]["czas_pomiaru"] == "2026-10-17T15:10:00"


def bo_project(**over):
    base = {"id": "13294", "number": "197", "title": "Poprawa bezpieczeństwa na przejściu",
            "shortDescription": "Montaż elementów odblaskowych.", "status": "5", "firstName": "Jan",
            "lastName": "Kowalski", "cocreators": "[{'name': 'Anna Nowak'}]", "cost": "5000.0",
            "lat": "52.2758891127166", "lng": "20.9231851102231",
            "pins": "[{'id': '1', 'lat': '52.2758891127166', 'lng': '20.9231851102231'}]",
            "classifications": "['komunikacja publiczna i drogi', 'przestrzeń publiczna']",
            "recipients": "['dzieci', 'seniorzy']", "localization": "ul. Conrada 15",
            "mainRegionName": "Bielany", "url": "http://bo.um.warszawa.pl/processes/na-rok-2019/f/5/projects/13294"}
    return base | over


def test_bo_parses_repr_lists_and_status_from_query():
    [poi] = bo.normalize(bo_project(), 2025, "w_realizacji", DISTRICTS)
    p = poi["properties"]
    assert (p["category"], p["subtype"]) == ("future", "bo_project")
    assert p["tags"] == ["komunikacja publiczna i drogi", "przestrzeń publiczna"]
    assert p["meta"]["dla_kogo"] == ["dzieci", "seniorzy"]
    assert (p["meta"]["status"], p["meta"]["edycja"], p["meta"]["koszt_zl"]) == ("w_realizacji", 2025, 5000)
    assert p["cell_id"] == assign_cell(20.9231851102231, 52.2758891127166)
    assert bo.normalize(bo_project(), 2020, "zrealizowane", DISTRICTS)[0]["properties"]["subtype"] == "bo_done"


def test_bo_drops_personal_data():
    dumped = json.dumps(bo.normalize(bo_project(), 2025, "w_realizacji", DISTRICTS), ensure_ascii=False)
    for personal in ("Jan", "Kowalski", "Anna Nowak"):
        assert personal not in dumped


def test_bo_many_pins_and_fallback_to_lat_lng():
    pins = "[" + ", ".join(f"{{'lat': '52.23', 'lng': '21.0{i}'}}" for i in range(3)) + "]"
    assert len({p["id"] for p in bo.normalize(bo_project(pins=pins), 2025, "w_realizacji", DISTRICTS)}) == 3
    assert len(bo.normalize(bo_project(pins="[]"), 2025, "w_realizacji", DISTRICTS)) == 1
    assert bo.normalize(bo_project(pins="[]", lat="", lng=""), 2025, "w_realizacji", DISTRICTS) == []


def test_route_swaps_lat_lon_and_keeps_stops():
    route = {"title": "Śladami PRL", "length": "18.00", "description": "Opis.",
             "traces": [[52.2674686, 20.9840425], [52.2463641, 21.0171875]],
             "tourist_points": [{"name": "Rynek\xa0Mariensztacki", "latlng": {"lat": "52.2463641", "lng": "21.0171875"}}]}
    f = trasy.normalize(route, DISTRICTS)
    p = f["properties"]
    assert f["geometry"]["coordinates"][0] == [20.984043, 52.267469]  # GeoJSON order: lon, lat
    assert (p["category"], p["subtype"], p["meta"]["dlugosc_km"]) == ("culture", "tourist_route", 18.0)
    assert p["meta"]["punkty"][0]["nazwa"] == "Rynek Mariensztacki"
    assert assign_cell(20.9840425, 52.2674686) in p["cell_ids"]
    assert len(p["cell_ids"]) > 5  # ~2.9 km line crosses many 200 m cells
