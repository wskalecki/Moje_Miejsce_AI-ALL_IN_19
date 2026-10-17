"""Warsaw noise unions (Lden and Lnight) from the cached GIOŚ HAŁAS pages (see fetch_gios_noise.py).

`load_unions(indicator)` returns, in EPSG:2180, one (Multi)Polygon per threshold and source:
    {"road": {60: geom, 65: geom}, "rail": {...}, "any": {...}}
where `geom` is the area with the indicator >= threshold from that source ("any" = road OR rail;
rail includes trams, GIOŚ has no separate tram layer). Indicators: "LDWN" (Lden, thresholds
55/60/65/70 dB) and "LN" (Lnight, 50/55/60/65 dB). Contours are clipped to the Warsaw boundary
(data/boundaries/warszawa_dzielnice.geojson) and repaired with make_valid. The result is cached
as WKB in data/raw/noise/unions.json (LDWN) and unions_LN.json (LN).

Needs shapely>=2 and pyproj (e.g. the data/scripts/siatka venv).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import shapely
from pyproj import Transformer
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/noise"
CACHE = RAW / "unions.json"
DISTRICTS = ROOT / "data/boundaries/warszawa_dzielnice.geojson"
INDICATORS = {"LDWN": (55, 60, 65, 70), "LN": (50, 55, 60, 65)}
THRESHOLDS = INDICATORS["LDWN"]
SOURCES = ("road", "rail")


def band_min_db(przedzial: str) -> int:
    """'Lden6064' -> 60, 'LdenGreaterThan80' -> 80, 'Lnight5054' -> 50."""
    m = re.match(r"L(?:den|night)(?:GreaterThan)?(\d{2})", przedzial)
    if not m:
        raise ValueError(przedzial)
    return int(m.group(1))


def warsaw_2180():
    tr = Transformer.from_crs(4326, 2180, always_xy=True)
    polys = []
    for f in json.loads(DISTRICTS.read_text())["features"]:
        g = shapely.transform(shape(f["geometry"]), lambda c: list(zip(*tr.transform(c[:, 0], c[:, 1]))))
        polys.append(g)
    return shapely.make_valid(shapely.union_all(polys))


def available(indicator: str = "LDWN") -> bool:
    return all(any(RAW.glob(f"gios_{s}_{indicator}_p*.json")) for s in SOURCES)


def cache_path(indicator: str) -> Path:
    return CACHE if indicator == "LDWN" else RAW / f"unions_{indicator}.json"


def unions_by_threshold(bands: dict[str, list[tuple[int, object]]], city, thresholds) -> dict:
    """{source: [(band lower bound dB, geom), ...]} -> {source | "any": {threshold: area >= threshold in the city}}."""
    out: dict[str, dict[int, object]] = {}
    for s, items in bands.items():
        out[s] = {}
        for t in thresholds:
            parts = [g for b, g in items if b >= t]
            u = shapely.union_all(parts) if parts else shapely.Polygon()
            out[s][t] = shapely.make_valid(u.intersection(city))
    out["any"] = {t: shapely.make_valid(shapely.union_all([out[s][t] for s in bands])) for t in thresholds}
    return out


def load_unions(indicator: str = "LDWN") -> dict:
    cache = cache_path(indicator)
    if cache.exists():
        raw = json.loads(cache.read_text())
        return {s: {int(t): shapely.from_wkb(bytes.fromhex(h)) for t, h in d.items()} for s, d in raw.items()}
    if not available(indicator):
        raise FileNotFoundError(f"run data/scripts/noise/fetch_gios_noise.py first ({indicator} pages missing)")
    city = warsaw_2180()
    city_box = shapely.box(*city.bounds)
    bands: dict[str, list[tuple[int, object]]] = {s: [] for s in SOURCES}
    for s in SOURCES:
        for path in sorted(RAW.glob(f"gios_{s}_{indicator}_p*.json")):
            for f in json.loads(path.read_text())["features"]:
                g = shape(f["geometry"])
                if not g.intersects(city_box):
                    continue  # Radom, Płock
                bands[s].append((band_min_db(f["properties"]["przedzial"]), shapely.make_valid(g)))
    out = unions_by_threshold(bands, city, INDICATORS[indicator])
    cache.write_text(json.dumps({s: {str(t): shapely.to_wkb(g, hex=True) for t, g in d.items()} for s, d in out.items()}))
    return out


if __name__ == "__main__":
    city_km2 = warsaw_2180().area / 1e6
    for ind in INDICATORS:
        for s, d in load_unions(ind).items():
            print(ind, s, "  ".join(f">={t} dB: {g.area / 1e6:6.2f} km²" for t, g in d.items()), f"(city {city_km2:.1f} km²)")
