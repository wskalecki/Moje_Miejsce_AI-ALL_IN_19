"""Read the Warsaw GTFS feed (mkuran.pl) straight from its zip; standard library only.

Source: https://mkuran.pl/gtfs/warsaw.zip — data by ZTM Warszawa, GTFS by Mikołaj Kuranowski,
bus shapes © OpenStreetMap contributors (ODbL). Download it to data/raw/gtfs/warsaw.zip
(gitignored, ~100 MB). stop_times.txt is ~500 MB unpacked, so it is streamed, never extracted.

Feed quirks:
- `stop_id` of bus and tram posts is `{zespol}{slupek}` (e.g. 700201), the same as our
  `sourceId` in data/poi/transit.geojson. Metro and rail use station IDs (`3009M`) with
  platforms (`3009M:P1`).
- Every day has its own `service_id` (e.g. `2026-10-19:PcS`) in calendar_dates.txt.
- Metro trips are templates repeated by frequencies.txt (headway), not explicit runs.
- Times may pass 24:00:00 (trips after midnight belong to the previous service day).
"""

from __future__ import annotations

import csv
import io
import zipfile
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

from um_api import DATA_DIR

FEED_PATH = DATA_DIR / "raw" / "gtfs" / "warsaw.zip"
SOURCE_URL = "https://mkuran.pl/gtfs/warsaw.zip"
ATTRIBUTION = "ZTM Warszawa (dane), Mikołaj Kuranowski (GTFS), © OpenStreetMap (kształty tras)"

# GTFS route_type → our mode names
MODES = {"0": "tramwaj", "1": "metro", "2": "kolej", "3": "autobus"}


@dataclass(frozen=True)
class Route:
    route_id: str
    name: str
    mode: str


@dataclass(frozen=True)
class StopTime:
    trip_id: str
    sequence: int
    stop_id: str
    arrival: int  # seconds after the service day's midnight
    departure: int


def seconds(hhmmss: str) -> int:
    h, m, s = (int(x) for x in hhmmss.split(":"))
    return h * 3600 + m * 60 + s


class Feed:
    def __init__(self, path: Path = FEED_PATH):
        if not path.exists():
            raise FileNotFoundError(f"Brak {path}; pobierz {SOURCE_URL} do data/raw/gtfs/")
        self.zip = zipfile.ZipFile(path)

    def rows(self, name: str) -> Iterator[dict[str, str]]:
        with self.zip.open(name) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))

    def has(self, name: str) -> bool:
        return name in self.zip.namelist()

    def version(self) -> str | None:
        return next((r.get("feed_version") for r in self.rows("feed_info.txt")), None)

    def stops(self) -> dict[str, dict[str, str]]:
        return {r["stop_id"]: r for r in self.rows("stops.txt")}

    def routes(self) -> dict[str, Route]:
        return {
            r["route_id"]: Route(r["route_id"], r["route_short_name"], MODES.get(r["route_type"], "inne"))
            for r in self.rows("routes.txt")
        }

    def service_dates(self) -> dict[str, set[str]]:
        """date (YYYYMMDD) → service_ids running that day."""
        out: dict[str, set[str]] = {}
        for r in self.rows("calendar_dates.txt"):
            if r["exception_type"] == "1":
                out.setdefault(r["date"], set()).add(r["service_id"])
        return out

    def trips(self, service_ids: set[str]) -> dict[str, str]:
        """trip_id → route_id for trips of the given services."""
        return {r["trip_id"]: r["route_id"] for r in self.rows("trips.txt") if r["service_id"] in service_ids}

    def frequencies(self, trip_ids: set[str]) -> dict[str, list[tuple[int, int, int]]]:
        """template trip_id → [(start, end, headway)] in seconds."""
        out: dict[str, list[tuple[int, int, int]]] = {}
        if not self.has("frequencies.txt"):
            return out
        for r in self.rows("frequencies.txt"):
            if r["trip_id"] in trip_ids:
                out.setdefault(r["trip_id"], []).append(
                    (seconds(r["start_time"]), seconds(r["end_time"]), int(r["headway_secs"])))
        return out

    def stop_times(self, trip_ids: set[str]) -> Iterator[StopTime]:
        for r in self.rows("stop_times.txt"):
            if r["trip_id"] in trip_ids:
                yield StopTime(r["trip_id"], int(r["stop_sequence"]), r["stop_id"],
                               seconds(r["arrival_time"]), seconds(r["departure_time"]))


def expand_frequencies(template: list[StopTime], windows: list[tuple[int, int, int]]) -> list[list[StopTime]]:
    """Concrete runs of a headway-based template trip; the template's first departure is its offset 0."""
    ordered = sorted(template, key=lambda st: st.sequence)
    if not ordered:
        return []
    t0 = ordered[0].departure
    runs = []
    for start, end, headway in windows:
        for begin in range(start, end, headway):
            shift = begin - t0
            run_id = f"{ordered[0].trip_id}@{begin}"
            runs.append([StopTime(run_id, st.sequence, st.stop_id, st.arrival + shift, st.departure + shift)
                         for st in ordered])
    return runs


def platform_parent(stops: dict[str, dict[str, str]], stop_id: str) -> str:
    """Station ID for a metro/rail platform (3009M:P1 → 3009M), the stop itself otherwise."""
    return stops.get(stop_id, {}).get("parent_station") or stop_id
