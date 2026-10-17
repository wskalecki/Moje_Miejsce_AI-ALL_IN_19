"""Datasets from dane.um.warszawa.pl (city open data portal) — the core required by the regulamin.

Needs UM_WARSZAWA_API_KEY in data/.env (or a cache from a run that had it).
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

from siatka.indicator import CountWithin, IdwValue, NearestDistance
from siatka.model import POI, dataset
from siatka.sources import address, um_api

NOW = datetime.now(timezone.utc)


def _kv(values: list[dict]) -> dict:
    return {v["key"]: v["value"] for v in values}


@dataset(
    "um_stops",
    um_api.source("lokalizacja-przystanow-komunikacji-miejskiej", "Lokalizacja przystanków komunikacji miejskiej"),
)
def stops():
    out = []
    for row in um_api.get("ztm_przystanki_komunikacji_miejskiej"):
        v = _kv(row["values"])
        try:
            lat, lon = float(v["szer_geo"]), float(v["dlug_geo"])
        except (KeyError, TypeError, ValueError):
            continue
        out.append(
            POI(
                source_key="lokalizacja-przystanow-komunikacji-miejskiej",
                source_id=f"{v['zespol']}_{v['slupek']}",
                category="transit",
                subtype="stop",
                lon=lon,
                lat=lat,
                name=f"{v.get('nazwa_zespolu', '')} {v['slupek']}".strip(),
            )
        )
    return out


@dataset("um_toilets", um_api.source("toalety", "Toalety"))
def toilets():
    out = []
    for f in um_api.get("m_toalety"):
        p = f["properties"]
        lon, lat = f["geometry"]["coordinates"][:2]
        tags = [t for t, flag in (("przewijak", p.get("przewijak")), ("bez_barier", p.get("dostepnosc"))) if flag == 1]
        if p.get("platnosc") == 0:
            tags.append("bezplatna")
        out.append(
            POI(
                source_key="toalety",
                source_id=hashlib.sha1(f"{lon:.6f},{lat:.6f},{p.get('lokalizacja')}".encode()).hexdigest()[:12],
                category="amenity",
                subtype="toilet",
                lon=lon,
                lat=lat,
                name=p.get("lokalizacja"),
                tags=tags,
                meta={"godziny": p.get("godziny"), "aktu_dan": p.get("aktu_dan")},
            )
        )
    return out


@dataset("um_pitches", um_api.source("otwarte-boiska", "Otwarte boiska"))
def pitches():
    """School sports grounds open to residents; geocoded from address (city address points)."""
    out, seen = [], set()
    for i, r in enumerate(um_api.get("be_otwarte_boiska")):
        hit = address.geocode(r.get("Adres obiektu", ""))
        if not hit:
            continue
        lon, lat, precision = hit
        key = (r.get("Adres obiektu"), r.get("Typ obiektu"))
        if key in seen:  # one row per pitch type per school is enough for the map
            continue
        seen.add(key)
        out.append(
            POI(
                source_key="otwarte-boiska",
                source_id=str(i),
                category="sport",
                subtype="pitch",
                lon=lon,
                lat=lat,
                name=r.get("Nazwa placówki oświatowej"),
                tags=[r.get("Typ obiektu", "")],
                meta={"adres": r.get("Adres obiektu"), "geokodowanie": precision, "sobota": r.get("Sobota")},
            )
        )
    return out


@dataset("um_air_quality", um_api.source("monitoring-jakosci-powietrza", "Monitoring jakości powietrza"))
def air_quality():
    out = []
    for st in um_api.get("bopipk_monitoring_jakosci_powietrza"):
        # city sensors report "PM2.5", GIOŚ reference stations "PM25"
        pm25 = next((d for d in st.get("data", []) if d.get("param_code") in ("PM2.5", "PM25")), None)
        if st.get("lat") is None or pm25 is None or pm25.get("value") is None:
            continue
        out.append(
            POI(
                source_key="monitoring-jakosci-powietrza",
                source_id=str(st.get("station") or st.get("name")),
                category="environment",
                subtype="air_sensor",
                lon=float(st["lon"]),
                lat=float(st["lat"]),
                name=st.get("name"),
                meta={"pm25": round(float(pm25["value"]), 1), "time": pm25.get("time"), "ijp": st.get("ijp", {}).get("name")},
            )
        )
    return out


def _upcoming(occurrences: list[dict], days: int = 30) -> bool:
    end = NOW + timedelta(days=days)
    for occ in occurrences or []:
        try:
            start = datetime.fromisoformat(occ["from"].replace("+01", "+01:00").replace("+02", "+02:00"))
            stop = datetime.fromisoformat(occ.get("to", occ["from"]).replace("+01", "+01:00").replace("+02", "+02:00"))
        except (KeyError, ValueError):
            continue
        if start <= end and stop >= NOW:
            return True
    return False


@dataset("um_events", um_api.source("kalendarz-wydarzen", "Kalendarz wydarzeń"))
def events():
    out = []
    for i, ev in enumerate(um_api.get("bmm_kalendarz_wydarzen")):
        if not _upcoming(ev.get("occurrence")):
            continue
        for j, f in enumerate((ev.get("map") or {}).get("features", [])):
            lon, lat = f["geometry"]["coordinates"][:2]
            out.append(
                POI(
                    source_key="kalendarz-wydarzen",
                    source_id=f"{i}_{j}",
                    category="culture",
                    subtype="event",
                    lon=lon,
                    lat=lat,
                    name=ev.get("title"),
                    meta={"od": (ev.get("occurrence") or [{}])[0].get("from"), "url": ev.get("url")},
                )
            )
    return out


@dataset("um_road_works", um_api.source("utrudnienia-w-ruchu-drogowym", "Utrudnienia w ruchu drogowym"), publish=False)
def road_works():
    """Every vertex of every active disruption (same source_id), for distinct counting."""
    out = []
    for i, u in enumerate(um_api.get("bin_utrudnienia_drogowe")):
        for part in u.get("geo") or []:
            for geom in part:
                for pt in geom.get("latlngs", []):
                    out.append(
                        POI(
                            source_key="utrudnienia-w-ruchu-drogowym",
                            source_id=str(u.get("id", i)),
                            category="transit",
                            subtype="road_works",
                            lon=pt["lng"],
                            lat=pt["lat"],
                            name=u.get("name"),
                        )
                    )
    return out


@dataset("um_aed", um_api.source("lokalizacja-defibryzatorow-aed", "Lokalizacja defibrylatorów (AED)"))
def aed():
    out = []
    for f in um_api.get("scb_lokalizacja_defibrylatorow"):
        coords = f["geometry"]["coordinates"]
        lon, lat = coords[0] if isinstance(coords[0], list) else coords
        p = f["properties"]
        out.append(
            POI(
                source_key="lokalizacja-defibryzatorow-aed",
                source_id=str(p.get("defibrillator_id")),
                category="amenity",
                subtype="aed",
                lon=lon,
                lat=lat,
                name=p.get("location_object_name"),
                tags=["24h"] if p.get("device_availability") == "Całodobowa" else [],
                meta={"dostep": p.get("device_access_description")},
            )
        )
    return out


INDICATORS = [
    CountWithin(
        key="transit_stops_count",
        label="Przystanki komunikacji miejskiej w promieniu 500 m",
        category="transport",
        good=12,
        bad=0,
        radius=500,
        datasets=("um_stops",),
    ),
    CountWithin(
        key="traffic_disruptions_1km",
        label="Utrudnienia w ruchu w promieniu 1 km",
        category="transport",
        good=0,
        bad=4,
        radius=1000,
        distinct=True,
        datasets=("um_road_works",),
        description="Aktywne i zapowiedziane utrudnienia (infoulice), liczone raz na utrudnienie.",
    ),
    CountWithin(
        key="toilets_with_changing_table",
        label="Toalety z przewijakiem w promieniu 1 km",
        category="codziennosc",
        good=3,
        bad=0,
        radius=1000,
        where=lambda p: "przewijak" in p.tags,
        datasets=("um_toilets",),
    ),
    NearestDistance(
        key="toilet_accessible_dist_m",
        label="Najbliższa toaleta bez barier",
        category="codziennosc",
        good=500,
        bad=3000,
        where=lambda p: "bez_barier" in p.tags,
        datasets=("um_toilets",),
    ),
    CountWithin(
        key="sport_places",
        label="Otwarte boiska szkolne w promieniu 1 km",
        category="sport",
        good=6,
        bad=0,
        radius=1000,
        datasets=("um_pitches",),
    ),
    IdwValue(
        key="aq_pm25_idw",
        label="Pył PM2.5 (pomiar z dziś)",
        category="srodowisko",
        unit="µg/m³",
        good=5,
        bad=25,
        value_of=lambda p: p.meta.get("pm25"),
        datasets=("um_air_quality",),
        description="Interpolacja (IDW, do 5 km) z najnowszych pomiarów ze stacji w Warszawie i okolicy.",
    ),
    CountWithin(
        key="events_30d",
        label="Wydarzenia miejskie w promieniu 1 km (30 dni)",
        category="kultura",
        good=8,
        bad=0,
        radius=1000,
        datasets=("um_events",),
    ),
    NearestDistance(
        key="aed_dist_m",
        label="Najbliższy defibrylator (AED)",
        category="zdrowie",
        good=300,
        bad=1500,
        datasets=("um_aed",),
    ),
]
