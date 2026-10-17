"""Warsaw Lden noise unions from the cached GIOŚ HAŁAS pages (see fetch_gios_noise.py).

`load_unions()` returns, in EPSG:2180, one (Multi)Polygon per threshold and source:
    {"road": {60: geom, 65: geom}, "rail": {...}, "any": {...}}
where `geom` is the area with Lden >= threshold from that source ("any" = road OR rail;
rail includes trams, GIOŚ has no separate tram layer). Contours are clipped to the
Warsaw boundary (data/boundaries/warszawa_dzielnice.geojson) and repaired with
make_valid. The result is cached as WKB in data/raw/noise/unions.json.

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
THRESHOLDS = (55, 60, 65, 70)
SOURCES = ("road", "rail")


def band_min_db(przedzial: str) -> int:
    """'Lden6064' -> 60, 'LdenGreaterThan80' -> 80."""
    m = re.match(r"Lden(?:GreaterThan)?(\d{2})", przedzial)
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


def available() -> bool:
    return all(any(RAW.glob(f"gios_{s}_LDWN_p*.json")) for s in SOURCES)


def load_unions() -> dict:
    if CACHE.exists():
        raw = json.loads(CACHE.read_text())
        return {s: {int(t): shapely.from_wkb(bytes.fromhex(h)) for t, h in d.items()} for s, d in raw.items()}
    if not available():
        raise FileNotFoundError("run data/scripts/noise/fetch_gios_noise.py first")
    city = warsaw_2180()
    city_box = shapely.box(*city.bounds)
    bands: dict[str, dict[int, list]] = {s: {} for s in SOURCES}
    for s in SOURCES:
        for path in sorted(RAW.glob(f"gios_{s}_LDWN_p*.json")):
            for f in json.loads(path.read_text())["features"]:
                g = shape(f["geometry"])
                if not g.intersects(city_box):
                    continue  # Radom, Płock
                g = shapely.make_valid(g)
                bands[s].setdefault(band_min_db(f["properties"]["przedzial"]), []).append(g)
    out: dict[str, dict[int, object]] = {}
    for s in SOURCES:
        out[s] = {}
        for t in THRESHOLDS:
            parts = [g for b, gs in bands[s].items() if b >= t for g in gs]
            u = shapely.union_all(parts) if parts else shapely.Polygon()
            out[s][t] = shapely.make_valid(u.intersection(city))
    out["any"] = {t: shapely.make_valid(shapely.union_all([out[s][t] for s in SOURCES])) for t in THRESHOLDS}
    CACHE.write_text(json.dumps({s: {str(t): shapely.to_wkb(g, hex=True) for t, g in d.items()} for s, d in out.items()}))
    return out


if __name__ == "__main__":
    u = load_unions()
    city_km2 = warsaw_2180().area / 1e6
    for s, d in u.items():
        print(s, "  ".join(f">={t} dB: {g.area / 1e6:6.2f} km²" for t, g in d.items()), f"(city {city_km2:.1f} km²)")
