"""Geocode Warsaw street addresses with the city's official address points (EMUiA).

Source: GeoServer WFS 'Tarcza 4.0' (https://wms2.um.warszawa.pl/geoserver/wfs/wfs),
layer wfs:punkty_adresowe — ~127k points, free re-use (Urząd m.st. Warszawy).
"""

from __future__ import annotations

import json
import re
import statistics
from functools import lru_cache

from siatka.sources.cache import fetch

URL = (
    "https://wms2.um.warszawa.pl/geoserver/wfs/wfs?service=WFS&version=2.0.0&request=GetFeature"
    "&typeNames=wfs:punkty_adresowe&outputFormat=application/json&srsName=EPSG:4326"
    "&propertyName=NAZWA_ULICY,NUMER_PORZADKOWY,SHAPE"
)
_PREFIX = re.compile(
    r"^(ulica|ul\.?|aleja|aleje|al\.?|plac|pl\.?|rondo|osiedle|os\.?|skwer|bulwar|wybrzeże|wyb\.?)\s+", re.I
)
_NUMBER = re.compile(r"\d+\s*[a-zA-Z]?")


def norm_street(name: str) -> str:
    name = re.sub(r"\(.*?\)", " ", name)  # 'ul. Cieplarniana (Wesoła)' -> district hint dropped
    name = _PREFIX.sub("", name.strip().lower())
    return re.sub(r"\s+", " ", name.replace('"', "").replace("„", "").replace("”", ""))


def norm_number(number: str) -> str | None:
    m = _NUMBER.search(number or "")
    return m.group(0).replace(" ", "").lower() if m else None


@lru_cache(maxsize=1)
def _index() -> tuple[dict, dict]:
    raw, _ = fetch("city_address_points", URL, ext="json")
    exact: dict[tuple[str, str], tuple[float, float]] = {}
    by_street: dict[str, list[tuple[float, float]]] = {}
    for f in json.loads(raw)["features"]:
        p = f["properties"]
        if not p.get("NAZWA_ULICY") or not f.get("geometry"):
            continue
        street = norm_street(p["NAZWA_ULICY"])
        lon, lat = f["geometry"]["coordinates"]
        number = norm_number(p.get("NUMER_PORZADKOWY") or "")
        if number:
            exact[(street, number)] = (lon, lat)
        by_street.setdefault(street, []).append((lon, lat))
    return exact, by_street


def geocode(address: str) -> tuple[float, float, str] | None:
    """(lon, lat, precision) for 'ul. Elbląska 51'; precision is 'address' or 'street'."""
    m = re.match(r"^(.*?)(\d.*)?$", address.strip())
    street, number = norm_street(m.group(1).strip(" ,")), norm_number(m.group(2) or "")
    exact, by_street = _index()
    if number and (street, number) in exact:
        return (*exact[(street, number)], "address")
    if number and (street, re.sub(r"[a-z]$", "", number)) in exact:
        return (*exact[(street, re.sub(r"[a-z]$", "", number))], "address")
    pts = by_street.get(street)
    if pts:  # street known, number not — use the street's median point
        return statistics.median(p[0] for p in pts), statistics.median(p[1] for p in pts), "street"
    return None
