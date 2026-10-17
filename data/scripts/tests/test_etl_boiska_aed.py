"""Pitches (geocoded) and AED ETL → POI schema (docs/data/poi-schema.md).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import etl_aed  # noqa: E402
import etl_boiska  # noqa: E402
from geocode_address import Geocoder, norm_street, split_address  # noqa: E402
from generate_grid import assign_cell, load_districts  # noqa: E402

DISTRICTS = load_districts()


def address_point(street, number, lon, lat):
    return {"properties": {"NAZWA_ULICY": street, "NUMER_PORZADKOWY": number},
            "geometry": {"type": "Point", "coordinates": [lon, lat]}}


# Two "Szkolna 5": one in Śródmieście, one in Wawer.
GEOCODER = Geocoder(
    [address_point("ulica Elbląska", "51", 20.9681, 52.2678),
     address_point("ulica Szkolna", "5", 21.0090, 52.2340),
     address_point("ulica Szkolna", "5", 21.1900, 52.2050),
     address_point("ulica Szkolna", "7", 21.1910, 52.2055)],
    DISTRICTS,
)


def test_address_normalisation():
    assert norm_street("ul. Cieplarniana (Wesoła)") == "cieplarniana"
    assert split_address("ul. Elbląska 51A") == ("elbląska", "51a")


def test_geocoder_prefers_the_given_district():
    assert GEOCODER.geocode("ul. Szkolna 5", "Wawer").lon == 21.19
    assert GEOCODER.geocode("ul. Szkolna 5", "Śródmieście").lon == 21.009
    assert GEOCODER.geocode("ul. Elbląska 51B").precision == "address"
    assert GEOCODER.geocode("ul. Szkolna 99", "Wawer").precision == "street"
    assert GEOCODER.geocode("ul. Nieistniejąca 1") is None


def test_geocoder_expands_abbreviated_first_names():
    geocoder = Geocoder([address_point("ulica Bolesława Limanowskiego", "9", 21.03, 52.17)], DISTRICTS)
    assert geocoder.geocode("ul. B. Limanowskiego 9, 02-943 Warszawa").precision == "address"
    assert geocoder.geocode("Limanowskiego 9").precision == "address"


def pitch_row(typ, **over):
    base = {"Dzielnica": "Żoliborz", "Adres obiektu": "ul. Elbląska 51", "Nazwa placówki oświatowej": "LXIV LO",
            "Typ obiektu": typ, "Rodzaj nawierzchni": "polireutan", "Obiekt wyposażony w trybuny": "NIE",
            "Obiekt wyposażony w piłkochwyty": "TAK", "Sobota": "Od 10:00 do 22:00", "Uwagi": "",
            "Data aktualizacji": "2026-07-02"}
    return base | over


def test_rows_of_one_school_become_one_pitch_poi():
    rows = [pitch_row("boiska do koszykówki"), pitch_row("bieżnie proste", **{"Data aktualizacji": "2026-08-01"})]
    [(key, group)] = etl_boiska.group_rows(rows).items()
    p = etl_boiska.normalize(*key, group, GEOCODER, DISTRICTS)["properties"]
    assert (p["category"], p["subtype"], p["name"]) == ("sport", "pitch", "LXIV LO")
    assert p["tags"] == ["bieżnie proste", "boiska do koszykówki"]
    assert p["meta"]["liczba_obiektow"] == 2
    assert p["meta"]["obiekty"][0]["trybuny"] is False
    assert p["meta"]["obiekty"][0]["godziny"]["Poniedziałek"] is None
    assert p["meta"]["uwagi"] is None
    assert p["meta"]["aktualizacja"] == "2026-08-01"
    assert p["cell_id"] == assign_cell(20.9681, 52.2678)


def aed(coords=((21.0148748892902, 52.2086170695684),), **over):
    props = {"defibrillator_id": "622", "device_availability": "Ograniczona", "device_public_access": "Publiczny",
             "location_object_name": "Urząd Dzielnicy Mokotów", "location_street": "Rakowiecka",
             "location_building": "25/27", "device_access_description": "Pn 8-18"} | over
    return {"geometry": {"type": "Point", "coordinates": [list(c) for c in coords]}, "properties": props}


def test_aed_nested_coordinates_and_flags():
    poi = etl_aed.normalize(aed(), DISTRICTS)
    p = poi["properties"]
    assert poi["geometry"]["coordinates"] == [21.014875, 52.208617]
    assert (p["id"], p["category"], p["subtype"]) == ("lokalizacja-defibryzatorow-aed_622", "amenity", "aed")
    assert p["meta"]["calodobowy"] is False
    assert p["meta"]["adres"] == "Rakowiecka 25/27"
    assert p["tags"] == ["publiczny"]
    assert p["district"] == "Mokotów"


def test_aed_availability_values():
    assert etl_aed.round_the_clock("Tak") is True
    assert etl_aed.round_the_clock("Nie (dostęp: pon. - piątek 8:00 - 16:00)") is False
    assert etl_aed.round_the_clock(None) is None


def test_aed_without_id_or_point_is_dropped():
    assert etl_aed.normalize(aed(defibrillator_id=None), DISTRICTS) is None
    assert etl_aed.normalize({"geometry": None, "properties": {"defibrillator_id": "1"}}, DISTRICTS) is None
