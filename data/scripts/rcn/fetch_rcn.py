# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6"]
# ///
"""Download and flatten Warsaw RCN flat transactions (Rejestr Cen Nieruchomości).

Source: yearly GML packages published by the city (Biuro Geodezji i Katastru) at
  https://architektura.um.warszawa.pl/udostepniane-dane-rcn1
  zbior_danych_rcn_<year>.zip (2021-2025) and zbior_danych_rciwn_2026_<yyyymmdd>.zip
They contain the same records as the GUGiK WFS (https://mapy.geoportal.gov.pl/wss/service/rcn,
ms:lokale; namespace PL.PZGiK.5346.RCN), but are fresher (the 2026 package of 5 X 2026 is
dense up to ~IV 2026, the WFS only up to ~II 2026) and cover the whole city in one file.
Licence: free re-use (RCN is free of charge since 13 II 2026, art. 40a ust. 2 pkt 1 lit. k
PGiK); cite "Urząd m.st. Warszawy / RCN".

GML schema (GUGiK RCN 1.4) is relational via xlink:href:
  RCN_Transakcja --nieruchomosc--> RCN_Nieruchomosc --lokal--> RCN_Lokal --adres--> RCN_Adres
  RCN_Transakcja --podstawaPrawna--> RCN_Dokument (date)
gml:id prefixes differ (PL.PZGIK.1465_ vs PL.PZGiK.5346.RCN_), so we join on the
"<uuid>_<version>" suffix. Coordinates: EPSG:2178, gml:pos = northing easting.

Filters (documented pitfalls, docs/data/zrodla-danych.md §3a):
  * funkcjaLokalu == 1 (residential flat), rodzajNieruchomosci == 4 (lokalowa)
  * udzialWPrawieDoNieruchomosci == 1/1 or empty (shares like 1/259 break price per m2)
  * rodzajTransakcji == 1 (free-market sale). Code 3 (non-tender sale, e.g. municipal flats
    sold to tenants with up to 90% discounts) and 2 (tender) are dropped and counted.
  * price from cenaLokaluBrutto (per flat; falls back to nothing - no imputation)
  * area >= 15 m2, 3 000 <= price/m2 <= 60 000 zł
  * one flat per (transaction, lokal id): duplicated versions are de-duplicated
Personal / notary data are NOT written: tworcaDokumentu (notary name), oznaczenieDokumentu
(repertorium number) and the party types are dropped while parsing.

Outputs (git-ignored):
  data/raw/rcn/*.zip                      raw city packages (cache; --refresh to redownload)
  data/rcn/lokale_mieszkalne.csv          one row per flat transaction (filtered)
  data/rcn/summary.json                   counts per year / filter step

Run: data/scripts/siatka/.venv/bin/python -I data/scripts/rcn/fetch_rcn.py [--years 2023,2024,2025,2026] [--refresh]
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import statistics
import sys
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from xml.etree.ElementTree import iterparse

from pyproj import Transformer

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "data" / "raw" / "rcn"
OUT_DIR = REPO / "data" / "rcn"
PAGE = "https://architektura.um.warszawa.pl/udostepniane-dane-rcn1"
BASE = "https://architektura.um.warszawa.pl"
UA = "Mozilla/5.0 (wwa42-hackathon; Warsaw open data)"

NS_RCN = "urn:gugik:specyfikacje:gmlas:rejestrcennieruchomosci:1.0"
NS_GML = "http://www.opengis.net/gml/3.2"
NS_XL = "http://www.w3.org/1999/xlink"
R = f"{{{NS_RCN}}}"
GML_ID = f"{{{NS_GML}}}id"
HREF = f"{{{NS_XL}}}href"

MIN_AREA = 15.0
MIN_PPM, MAX_PPM = 3_000.0, 60_000.0
MARKET = {"1": "pierwotny", "2": "wtorny"}

TODAY = date.today().isoformat()
TO_WGS = Transformer.from_crs(2178, 4326, always_xy=True)


def key(ref: str | None) -> str | None:
    """'PL.PZGiK.5346.RCN_<uuid>_<ver>' or 'PL.PZGIK.1465_<uuid>_<ver>' -> '<uuid>_<ver>'."""
    if not ref:
        return None
    m = re.search(r"_([0-9a-f]{8}-[0-9a-f-]{27}_.+)$", ref)
    return m.group(1) if m else ref


def list_packages() -> dict[int, str]:
    req = urllib.request.Request(PAGE, headers={"User-Agent": UA})
    html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
    out: dict[int, str] = {}
    for href in re.findall(r'href="([^"]+\.zip[^"]*)"', html):
        m = re.search(r"zbior_danych_rci?w?n_(\d{4})(?:_(\d{4}))?(?:_\d{8})?\.zip", href)
        if m and not m.group(2):  # single-year packages only
            out[int(m.group(1))] = BASE + href if href.startswith("/") else href
    return out


def ensure_zip(year: int, refresh: bool) -> Path:
    RAW.mkdir(parents=True, exist_ok=True)
    have = sorted(RAW.glob(f"zbior_danych_rc*_{year}*.zip"))
    if have and not refresh:
        return have[-1]
    urls = list_packages()
    if year not in urls:
        raise SystemExit(f"no RCN package for {year} on {PAGE}")
    name = re.search(r"/([^/]+\.zip)", urls[year]).group(1)
    dest = RAW / name
    print(f"  downloading {name} ...", file=sys.stderr)
    req = urllib.request.Request(urls[year], headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=600) as r, open(dest, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    return dest


def text(el, tag: str) -> str | None:
    c = el.find(R + tag)
    return c.text.strip() if c is not None and c.text else None


def parse_package(path: Path) -> list[dict]:
    """Stream one GML package and return joined flat-transaction rows (unfiltered)."""
    tx, nier, lok, adr, dok = {}, {}, {}, {}, {}
    with zipfile.ZipFile(path) as z:
        gml = next(n for n in z.namelist() if n.endswith(".gml"))
        with z.open(gml) as fh:
            for _, el in iterparse(fh, events=("end",)):
                tag = el.tag
                if not tag.startswith(R):
                    continue
                name = tag[len(R):]
                if name == "RCN_Transakcja":
                    pp = el.find(R + "podstawaPrawna")
                    tx[key(el.get(GML_ID))] = {
                        "tx": text(el, "oznaczenieTransakcji"),
                        "rodzaj": text(el, "rodzajTransakcji"),
                        "rynek": text(el, "rodzajRynku"),
                        "vat": text(el, "kwotaPodatkuVAT") is not None,
                        "dok": key(pp.get(HREF)) if pp is not None else None,
                        "nier": [key(n.get(HREF)) for n in el.findall(R + "nieruchomosc")],
                    }
                    el.clear()
                elif name == "RCN_Nieruchomosc":
                    nier[key(el.get(GML_ID))] = {
                        "rodzaj": text(el, "rodzajNieruchomosci"),
                        "udzial": text(el, "udzialWPrawieDoNieruchomosci"),
                        "lok": [key(n.get(HREF)) for n in el.findall(R + "lokal")],
                    }
                    el.clear()
                elif name == "RCN_Lokal":
                    pos = el.find(f"{R}georeferencja/{{{NS_GML}}}Point/{{{NS_GML}}}pos")
                    a = el.find(R + "adresBudynkuZLokalem")
                    lok[key(el.get(GML_ID))] = {
                        "id": text(el, "idLokalu"),
                        "pos": pos.text.split() if pos is not None and pos.text else None,
                        "funkcja": text(el, "funkcjaLokalu"),
                        "izby": text(el, "liczbaIzb"),
                        "kond": text(el, "nrKondygnacji"),
                        "pow": text(el, "powUzytkowaLokalu"),
                        "cena": text(el, "cenaLokaluBrutto"),
                        "adr": key(a.get(HREF)) if a is not None else None,
                    }
                    el.clear()
                elif name == "RCN_Adres":
                    adr[key(el.get(GML_ID))] = (text(el, "ulica"), text(el, "numerPorzadkowy"))
                    el.clear()
                elif name == "RCN_Dokument":
                    # only the date: tworcaDokumentu (notary) and oznaczenieDokumentu are dropped
                    dok[key(el.get(GML_ID))] = text(el, "dataSporzadzeniaDokumentu")
                    el.clear()
                elif name in ("RCN_Dzialka", "RCN_Budynek"):
                    el.clear()
    rows = []
    for tk, t in tx.items():
        date = dok.get(t["dok"])
        for nk in t["nier"]:
            n = nier.get(nk)
            if not n:
                continue
            for lk in n["lok"]:
                lo = lok.get(lk)
                if not lo:
                    continue
                rows.append({"t": t, "n": n, "l": lo, "date": date, "adr": adr.get(lo["adr"])})
    return rows


def num(s: str | None) -> float | None:
    try:
        return float(s) if s not in (None, "") else None
    except ValueError:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default="2023,2024,2025,2026")
    ap.add_argument("--refresh", action="store_true")
    args = ap.parse_args()
    years = [int(y) for y in args.years.split(",")]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    seen: set[tuple] = set()
    out_rows: list[dict] = []
    steps: dict[str, Counter] = defaultdict(Counter)
    codes: dict[str, Counter] = defaultdict(Counter)
    for y in years:
        path = ensure_zip(y, args.refresh)
        print(f"parsing {path.name} ...", file=sys.stderr)
        rows = parse_package(path)
        st = steps[str(y)]
        st["lokale_w_transakcjach"] = len(rows)
        for r in rows:
            t, n, lo = r["t"], r["n"], r["l"]
            codes["funkcjaLokalu"][lo["funkcja"]] += 1
            codes["rodzajTransakcji"][t["rodzaj"]] += 1
            codes["rodzajRynku"][t["rynek"]] += 1
            codes["rodzajNieruchomosci"][n["rodzaj"]] += 1
            if lo["funkcja"] != "1" or n["rodzaj"] != "4":
                st["odrzucone_nie_mieszkanie"] += 1
                continue
            if n["udzial"] not in (None, "", "1/1"):
                st["odrzucone_udzial"] += 1
                continue
            if t["rodzaj"] != "1":
                st[f"odrzucone_rodzaj_transakcji_{t['rodzaj']}"] += 1
                continue
            area, price = num(lo["pow"]), num(lo["cena"])
            if not area or not price:
                st["odrzucone_brak_ceny_lub_pow"] += 1
                continue
            if area < MIN_AREA:
                st["odrzucone_pow_lt_15"] += 1
                continue
            ppm = price / area
            if not (MIN_PPM <= ppm <= MAX_PPM):
                st["odrzucone_cena_m2_poza_3_60k"] += 1
                continue
            if not lo["pos"] or not r["date"]:
                st["odrzucone_brak_punktu_lub_daty"] += 1
                continue
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["date"]) or int(r["date"][:4]) not in years \
                    or r["date"] > TODAY:
                # typos such as 0203-.. / 2230-.. and late-registered deeds outside the requested years
                st["odrzucone_data_poza_latami"] += 1
                continue
            dedup = (t["tx"], lo["id"], r["date"], round(price))
            if dedup in seen:
                st["odrzucone_duplikat"] += 1
                continue
            seen.add(dedup)
            north, east = (float(v) for v in lo["pos"])
            lon, lat = TO_WGS.transform(east, north)
            lid = lo["id"] or ""
            m = re.match(r"(.+_BUD)\.", lid)
            street, nr = r["adr"] or (None, None)
            out_rows.append({
                "date": r["date"],
                "year": int(r["date"][:4]),
                "market": MARKET.get(t["rynek"] or "", ""),
                "vat": int(t["vat"]),
                "lokal_id": lid,
                "building_id": m.group(1) if m else "",
                "lon": round(lon, 6),
                "lat": round(lat, 6),
                "area_m2": round(area, 2),
                "rooms": lo["izby"] or "",
                "floor": lo["kond"] or "",
                "price_pln": round(price),
                "price_m2": round(ppm),
                "street": street or "",
                "number": nr or "",
            })
            st["zachowane"] += 1
        # the package year is the publication year; records are keyed by deed date
    out_rows.sort(key=lambda r: (r["date"], r["lokal_id"]))
    out = OUT_DIR / "lokale_mieszkalne.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)

    by_year: dict[int, list[int]] = defaultdict(list)
    by_month: Counter = Counter()
    for r in out_rows:
        by_year[r["year"]].append(r["price_m2"])
        by_month[r["date"][:7]] += 1
    summary = {
        "source": PAGE,
        "packages": sorted(p.name for p in RAW.glob("*.zip")),
        "filters": {"funkcjaLokalu": "1", "rodzajNieruchomosci": "4", "udzial": "1/1 or empty",
                    "rodzajTransakcji": "1 (wolnorynkowa)", "area_min_m2": MIN_AREA,
                    "price_m2_range": [MIN_PPM, MAX_PPM]},
        "steps_per_package": {k: dict(v) for k, v in steps.items()},
        "codes_seen": {k: {str(c): n for c, n in v.most_common()} for k, v in codes.items()},
        "per_deed_year": {y: {"n": len(v), "median_price_m2": round(statistics.median(v))} for y, v in sorted(by_year.items())},
        "per_month": dict(sorted(by_month.items())),
        "rows": len(out_rows),
    }
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1))
    print(json.dumps({k: summary[k] for k in ("steps_per_package", "per_deed_year", "rows")}, ensure_ascii=False, indent=1))
    print(f"-> {out} ({out.stat().st_size / 1e6:.1f} MB)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
