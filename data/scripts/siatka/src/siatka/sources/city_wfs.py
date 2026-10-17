"""City of Warsaw WFS (MapGuide, GML only). Free re-use, cite 'Urząd m.st. Warszawy'.

Two coordinate flavours on the same service:
- `ns92528565:*` layers in EPSG:2178 (easting ~7.5e6 first, northing ~5.8e6 second)
- `wfs:*` layers in EPSG:4326 (lon first)
"""

from __future__ import annotations

import xml.etree.ElementTree as ET

from pyproj import Transformer

from siatka.model import POI, Source
from siatka.sources.cache import fetch

WFS_URL = "https://wfs.um.warszawa.pl/serwis"
GML = "{http://www.opengis.net/gml}"
_FROM_2178 = Transformer.from_crs("EPSG:2178", "EPSG:4326", always_xy=True)


def source(layer: str) -> Source:
    return Source(
        name=f"WFS m.st. Warszawy — {layer.split(':')[-1]}",
        url=f"{WFS_URL}?service=WFS&request=GetCapabilities",
        license="Ponowne wykorzystanie bezpłatne; źródło: Urząd m.st. Warszawy",
        city_open_data=True,
    )


def features(layer: str) -> list[dict]:
    """Each feature as {'props': {...}, 'points': [(lon, lat), ...]} (all coordinates of the geometry)."""
    url = f"{WFS_URL}?service=WFS&version=1.1.0&request=GetFeature&typeName={layer}"
    raw, _ = fetch("city_wfs", url, ext="gml")
    root = ET.fromstring(raw)
    out = []
    for member in root.iter(f"{GML}featureMember"):
        feat = next(iter(member))
        props, coords = {}, []
        for child in feat:
            tag = child.tag.split("}")[-1]
            if len(child) == 0:
                props[tag] = (child.text or "").strip()
            else:
                for el in child.iter():
                    if el.tag in (f"{GML}pos", f"{GML}posList") and el.text:
                        nums = [float(v) for v in el.text.split()]
                        coords += list(zip(nums[0::2], nums[1::2]))
        out.append({"props": props, "points": [_to_lonlat(x, y) for x, y in coords]})
    return out


def _to_lonlat(x: float, y: float) -> tuple[float, float]:
    if x > 1_000_000:  # EPSG:2178
        return _FROM_2178.transform(x, y)
    return x, y  # already lon, lat


def point_pois(layer: str, *, source_key: str, category: str, subtype: str, name_field: str | None = None) -> list[POI]:
    out = []
    for i, feat in enumerate(features(layer)):
        if not feat["points"]:
            continue
        lons, lats = zip(*feat["points"])
        props = feat["props"]
        out.append(
            POI(
                source_key=source_key,
                source_id=props.get("OBJECTID") or str(i),
                category=category,
                subtype=subtype,
                lon=sum(lons) / len(lons),
                lat=sum(lats) / len(lats),
                name=props.get(name_field) if name_field else None,
                meta={k: v for k, v in props.items() if k in ("ADRES", "ULICA", "NUMER", "DZIELNICA", "AKTU_DAN")},
            )
        )
    return out
