"""Geocode Warsaw street addresses with the city's official address points (EMUiA).

Source: GeoServer WFS "Tarcza 4.0", layer wfs:punkty_adresowe (~127k points), free re-use,
źródło: Urząd m.st. Warszawy. Downloaded once to data/raw/punkty-adresowe/ (gitignored).

Street names repeat across districts ("Szkolna", "Polna"), so when an address matches
several points the one inside the given district wins.
"""

from __future__ import annotations

import re
import statistics
from dataclasses import dataclass

from generate_grid import district_at
from poi_common import Districts
from um_api import get_cached

SLUG = "punkty-adresowe"
URL = (
    "https://wms2.um.warszawa.pl/geoserver/wfs/wfs?service=WFS&version=2.0.0&request=GetFeature"
    "&typeNames=wfs:punkty_adresowe&outputFormat=application/json&srsName=EPSG:4326"
    "&propertyName=NAZWA_ULICY,NUMER_PORZADKOWY,SHAPE"
)
SOURCE_NOTE = "wfs:punkty_adresowe (WFS Tarcza 4.0), Urząd m.st. Warszawy"

_PREFIX = re.compile(
    r"^(ulica|ul\.?|aleja|aleje|al\.?|plac|pl\.?|rondo|osiedle|os\.?|skwer|bulwar|wybrzeże|wyb\.?)\s+", re.I
)
_NUMBER = re.compile(r"\d+\s*[a-zA-Z]?")

Point = tuple[float, float]


def norm_street(name: str) -> str:
    name = re.sub(r"\(.*?\)", " ", name)  # 'ul. Cieplarniana (Wesoła)' → district hint dropped
    name = _PREFIX.sub("", name.strip().lower())
    return re.sub(r"\s+", " ", re.sub(r"[\"„”]", "", name)).strip()


def norm_number(number: str) -> str | None:
    m = _NUMBER.search(number or "")
    return m.group(0).replace(" ", "").lower() if m else None


def split_address(address: str) -> tuple[str, str | None]:
    m = re.match(r"^(.*?)(\d.*)?$", address.strip())
    return norm_street(m.group(1).strip(" ,")), norm_number(m.group(2) or "")


@dataclass
class Hit:
    lon: float
    lat: float
    precision: str  # "address" or "street"


class Geocoder:
    def __init__(self, features: list[dict], districts: Districts):
        self.districts = districts
        self.exact: dict[tuple[str, str], list[Point]] = {}
        self.by_street: dict[str, list[Point]] = {}
        for f in features:
            p, geom = f.get("properties") or {}, f.get("geometry")
            if not p.get("NAZWA_ULICY") or not geom:
                continue
            street = norm_street(p["NAZWA_ULICY"])
            point = tuple(geom["coordinates"][:2])
            number = norm_number(p.get("NUMER_PORZADKOWY") or "")
            if number:
                self.exact.setdefault((street, number), []).append(point)
            self.by_street.setdefault(street, []).append(point)

    @classmethod
    def load(cls, districts: Districts, offline: bool = False) -> "Geocoder":
        return cls(get_cached(URL, SLUG, offline=offline)["features"], districts)

    def _in_district(self, points: list[Point], district: str | None) -> list[Point]:
        if district and self.districts and len(points) > 1:
            local = [pt for pt in points if district_at(*pt, self.districts) == district]
            return local or points
        return points

    def _full_street(self, street: str) -> str:
        """'b. limanowskiego' or 'szanajcy' → 'bolesława limanowskiego' when exactly one street matches."""
        if street in self.by_street:
            return street
        surname = re.sub(r"^(?:\w{1,3}\.\s*)+", "", street).strip()
        if not surname:
            return street
        if not hasattr(self, "_streets"):
            self._streets = sorted(self.by_street)
        matches = [s for s in self._streets if s == surname or s.endswith(" " + surname)]
        return matches[0] if len(matches) == 1 else street

    def geocode(self, address: str, district: str | None = None) -> Hit | None:
        street, number = split_address(address)
        street = self._full_street(street)
        for key in ([(street, number), (street, re.sub(r"[a-z]$", "", number))] if number else []):
            if key in self.exact:
                lon, lat = self._in_district(self.exact[key], district)[0]
                return Hit(lon, lat, "address")
        points = self._in_district(self.by_street.get(street, []), district)
        if points:  # street known, number not: the street's median point
            return Hit(statistics.median(p[0] for p in points), statistics.median(p[1] for p in points), "street")
        return None
