#!/usr/bin/env python3
"""Shared client for dane.um.warszawa.pl (standard library only).

Every call is `POST /api/action/get_<action>` with header `Authorization: <key>`
(no "Bearer"). The key comes from the UM_WARSZAWA_API_KEY environment variable
or from `data/.env`; it is never written to disk or printed.

Responses are cached in `data/raw/{slug}/response.json` (gitignored).
"""

from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path
from typing import Any

BASE = "https://dane.um.warszawa.pl"
DATA_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = DATA_DIR / ".env"
LICENSE = "CC BY — Urząd m.st. Warszawy"


class ApiError(RuntimeError):
    pass


def api_key() -> str:
    key = os.environ.get("UM_WARSZAWA_API_KEY", "").strip()
    if not key and ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8-sig").splitlines():
            name, sep, value = line.partition("=")
            if sep and name.strip() == "UM_WARSZAWA_API_KEY":
                key = value.strip().strip("'\"")
    if not key:
        raise ApiError("Brak klucza: ustaw UM_WARSZAWA_API_KEY albo dodaj go do data/.env")
    return key


def raw_path(slug: str) -> Path:
    return DATA_DIR / "raw" / slug / "response.json"


def get_cached(url: str, slug: str, offline: bool = False) -> Any:
    """GET a public JSON endpoint (no key), cached like portal responses."""
    cache = raw_path(slug)
    if offline or cache.exists():
        if not cache.exists():
            raise ApiError(f"Brak cache {cache.relative_to(DATA_DIR.parent)}; uruchom bez --offline")
        return json.loads(cache.read_text(encoding="utf-8-sig"))
    with urllib.request.urlopen(urllib.request.Request(url, headers={"Accept": "application/json"}), timeout=300) as resp:
        raw = resp.read()
    data = json.loads(raw.decode("utf-8-sig"))
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_bytes(raw)
    return data


def fetch(action: str, slug: str, payload: dict[str, Any] | None = None, offline: bool = False) -> Any:
    """Return the decoded response for `get_<action>`, using the cache when offline."""
    cache = raw_path(slug)
    if offline:
        if not cache.exists():
            raise ApiError(f"Brak cache {cache.relative_to(DATA_DIR.parent)}; uruchom bez --offline")
        return json.loads(cache.read_text(encoding="utf-8-sig"))

    req = urllib.request.Request(
        f"{BASE}/api/action/get_{action}",
        data=json.dumps(payload or {}).encode(),
        method="POST",
        headers={
            "Authorization": api_key(),
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
    data = json.loads(raw.decode("utf-8-sig"))
    # Without a valid key the portal answers HTTP 200 with this message; never cache it.
    if isinstance(data, dict) and data.get("message") == "Service unavailable":
        raise ApiError("Portal odpowiedział 'Service unavailable' (zły lub brak klucza)")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_bytes(raw)
    return data
