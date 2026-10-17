"""'Co się tu zmieni' — city projects and plans that will change a neighbourhood.

Participatory budget projects in progress and current public consultations
(dane.um.warszawa.pl), plus planned metro/tram lines (OSM).
"""

from __future__ import annotations

import re

from siatka.indicator import CountWithin, NearestDistance
from siatka.model import POI, dataset
from siatka.sources import osm, um_api

BO_EDITIONS = (2025, 2026, 2027)


@dataset("um_bo_in_progress", um_api.source("budzet-obywatelski", "Budżet obywatelski"))
def bo_in_progress():
    """BO projects being implemented. Author names in the source are dropped (RODO)."""
    out = []
    for year in BO_EDITIONS:
        try:
            projects = um_api.get("cks_budzet_obywatelski", {"rok": year, "status": "w_realizacji"})
        except Exception:
            continue
        for pr in projects:
            for k, pin in enumerate(pr.get("pins") or []):
                out.append(
                    POI(
                        source_key="budzet-obywatelski",
                        source_id=f"{pr['id']}_{k}",
                        category="future",
                        subtype="bo_project",
                        lon=pin["lng"],
                        lat=pin["lat"],
                        name=(pr.get("title") or "").strip(),
                        meta={"koszt_zl": pr.get("cost"), "edycja": pr.get("editionName"), "url": pr.get("url")},
                    )
                )
    return out


@dataset("um_consultations", um_api.source("konsultacje-spoleczne", "Konsultacje społeczne"))
def consultations():
    out = []
    for c in um_api.get("cks_konsultacje_spoleczne"):
        if c.get("latitude") is None or c.get("longitude") is None:
            continue
        out.append(
            POI(
                source_key="konsultacje-spoleczne",
                source_id=str(c["id"]),
                category="future",
                subtype="consultation",
                lon=float(c["longitude"]),
                lat=float(c["latitude"]),
                name=c.get("title"),
                meta={"do": c.get("end_date"), "url": f"https://konsultacje.um.warszawa.pl/processes/{c.get('slug')}"},
            )
        )
    return out


def _planned_rail(tags: dict) -> bool:
    return tags.get("railway") in ("construction", "proposed") and (
        tags.get("construction") in ("subway", "tram")
        or tags.get("proposed") in ("subway", "tram")
        or re.search(r"metr|tramwaj", tags.get("name", ""), re.I) is not None
    )


@dataset("osm_planned_rail", osm.OSM_SOURCE)
def planned_rail():
    """Planned / under-construction metro and tram lines (vertices sampled as points)."""
    out = []
    for el in osm.query(['["railway"~"^(construction|proposed)$"]'], geometry=True):
        tags = el.get("tags", {})
        if not _planned_rail(tags) or not el.get("geometry"):
            continue
        kind = "planned_metro" if "subway" in (tags.get("construction"), tags.get("proposed")) or re.search(
            r"metr", tags.get("name", ""), re.I
        ) else "planned_tram"
        geom = el["geometry"]
        for k, g in enumerate(geom[:: max(1, len(geom) // 20)]):
            out.append(
                POI(
                    source_key="osm",
                    source_id=f"w{el['id']}_{k}",
                    category="future",
                    subtype=kind,
                    lon=g["lon"],
                    lat=g["lat"],
                    name=tags.get("name"),
                    meta={"status": tags.get("railway")},
                )
            )
    return out


INDICATORS = [
    CountWithin(
        key="bo_projects_1km",
        label="Projekty budżetu obywatelskiego w realizacji w promieniu 1 km",
        category="przyszlosc",
        good=5,
        bad=0,
        radius=1000,
        datasets=("um_bo_in_progress",),
    ),
    NearestDistance(
        key="planned_rail_dist_m",
        label="Planowane metro lub tramwaj",
        category="przyszlosc",
        good=500,
        bad=3000,
        datasets=("osm_planned_rail",),
        description="Odległość do budowanej lub planowanej linii metra/tramwaju (OSM).",
    ),
]
