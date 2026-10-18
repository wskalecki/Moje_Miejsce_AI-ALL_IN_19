# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Download GIOŚ HAŁAS strategic noise map contours (SMH 2022, 4th round, Lden) for
Mazowieckie: road and rail (rail includes trams) noise inside agglomerations.

API (CC BY 4.0, Główny Inspektorat Ochrony Środowiska), see noise/sources.md on
branch feat/noise-dataset:
  GET https://dane.gios.gov.pl/api/halas/v1/zasiegi-halasu
      ?wojewodztwo=MAZOWIECKIE&rundaMapowania=4 Runda Mapowania
      &zrodloHalasu=<source>&wskaznik=<LDWN|LN>&liczbaElementowNaStronie=50&numerStrony=<n>
Geometry: MultiPolygon in EPSG:2180 (E, N), not declared in the GeoJSON.

Output: data/raw/noise/gios_<source>_<LDWN|LN>_p<n>.json (gitignored cache), Lden and Lnight.
Run:   python3 -I data/scripts/noise/fetch_gios_noise.py [--refresh]
"""

from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/noise"
API = "https://dane.gios.gov.pl/api/halas/v1/zasiegi-halasu"
SOURCES = {
    "road": "Hałas drogowy wewnątrz aglomeracji",
    "rail": "Hałas kolejowy wewnątrz aglomeracji",  # = rail + tram (no separate tram layer)
}
INDICATORS = {"LDWN": "Lden", "LN": "Lnight"}
PAGE = 50


def fetch_page(source: str, page: int, indicator: str) -> dict:
    q = urllib.parse.urlencode({
        "wojewodztwo": "MAZOWIECKIE", "rundaMapowania": "4 Runda Mapowania",
        "zrodloHalasu": SOURCES[source], "wskaznik": indicator,
        "liczbaElementowNaStronie": PAGE, "numerStrony": page,
    })
    req = urllib.request.Request(f"{API}?{q}", headers={"User-Agent": "moje-miejsce-hackathon/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                body = json.loads(r.read())
            if body.get("wynik", {}).get("status") != "SUKCES":
                raise ValueError(f"API status {body.get('wynik')}")
            return body
        except Exception as exc:  # noqa: BLE001 - retry any transport error
            print(f"  {source} {indicator} p{page} attempt {attempt + 1} failed: {exc}", file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"GIOŚ API failed for {source} {indicator} page {page}")


def main() -> int:
    refresh = "--refresh" in sys.argv
    RAW.mkdir(parents=True, exist_ok=True)
    for indicator in INDICATORS:
        for source in SOURCES:
            page = 0
            total = 0
            while True:
                path = RAW / f"gios_{source}_{indicator}_p{page}.json"
                if path.exists() and not refresh:
                    body = json.loads(path.read_text())
                else:
                    body = fetch_page(source, page, indicator)
                    path.write_text(json.dumps(body))
                n = len(body.get("features", []))
                total += n
                print(f"{source} {indicator} page {page}: {n} features ({path.stat().st_size / 1e6:.1f} MB)")
                if n < PAGE:
                    break
                page += 1
            print(f"{source} {indicator}: {total} features")
    meta = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "api": API, "license": "CC BY 4.0 — GIOŚ",
            "round": "4 Runda Mapowania (SMH 2022, data 2021)", "indicators": INDICATORS,
            "sources": SOURCES}
    (RAW / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
