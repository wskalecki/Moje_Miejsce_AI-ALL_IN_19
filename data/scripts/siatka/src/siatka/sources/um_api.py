"""dane.um.warszawa.pl API — the city open data portal (regulamin: min. 1 dataset from here).

Every call is `POST /api/action/get_<name>` with header `Authorization: <key>`
(no "Bearer"). Key comes from UM_WARSZAWA_API_KEY in data/.env.
"""

from __future__ import annotations

import json

from siatka.config import um_api_key
from siatka.model import Source
from siatka.sources.cache import CacheMiss, fetch

BASE = "https://dane.um.warszawa.pl"


class MissingApiKey(RuntimeError):
    pass


def source(slug: str, name: str) -> Source:
    return Source(
        name=f"dane.um.warszawa.pl — {name}",
        url=f"{BASE}/pl/catalogue",
        license="CC BY — Urząd m.st. Warszawy",
        slug=slug,
        city_open_data=True,
    )


def _check(body: bytes) -> None:
    head = body[:300].decode("utf-8-sig", "replace").strip()
    if head.startswith('{"message"') or head.startswith('{"detail"'):
        raise RuntimeError(f"dane.um.warszawa.pl error: {head}")


def get(action: str, payload: dict | None = None):
    """Call get_<action>; returns parsed JSON (cached under data/raw/um_api/).

    The cache key does not include the API key, so a run with the key also
    serves later runs without it (e.g. teammates working from the cache).
    """
    key = um_api_key()
    url = f"{BASE}/api/action/get_{action}"
    try:
        raw, _ = fetch(
            "um_api",
            url,
            method="POST",
            json_body=payload or {},
            headers={"Authorization": key or "", "Content-Type": "application/json"},
            ext="json",
            cached_only=key is None,
            validate=_check,
        )
    except CacheMiss as exc:
        raise MissingApiKey(f"get_{action}: set UM_WARSZAWA_API_KEY in data/.env") from exc
    text = raw.decode("utf-8-sig").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # some endpoints stream concatenated GeoJSON features
        decoder, pos, rows = json.JSONDecoder(), 0, []
        while pos < len(text):
            obj, end = decoder.raw_decode(text, pos)
            rows.append(obj)
            pos = end
            while pos < len(text) and text[pos] in " \r\n\t,":
                pos += 1
        return rows
