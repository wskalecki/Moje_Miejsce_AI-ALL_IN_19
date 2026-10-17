"""Disk cache for HTTP responses, so re-runs are fast and work offline during the demo."""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

from siatka.config import RAW_DIR

USER_AGENT = "siatka-etl/0.1 (Warsaw Open Data Hackathon 2026, team AI All In)"
TIMEOUT = 180

# SIATKA_OFFLINE=1 -> never hit the network, fail if something is not cached
OFFLINE = os.environ.get("SIATKA_OFFLINE") == "1"
# SIATKA_REFRESH=1 -> ignore the cache and download again
REFRESH = os.environ.get("SIATKA_REFRESH") == "1"


class CacheMiss(RuntimeError):
    pass


# Timestamps of every fetch (cached or not) — the pipeline reads them to report data freshness
FETCH_LOG: list[str] = []


def _path(namespace: str, key: str, ext: str) -> Path:
    digest = hashlib.sha1(key.encode()).hexdigest()[:16]
    return RAW_DIR / namespace / f"{digest}.{ext}"


def fetch(
    namespace: str,
    url: str,
    *,
    method: str = "GET",
    data: dict | str | None = None,
    json_body: dict | None = None,
    headers: dict | None = None,
    ext: str = "bin",
    cached_only: bool = False,
    validate=None,
) -> tuple[bytes, str]:
    """Return (body, fetched_at ISO timestamp), using the cache when possible.

    `validate(body)` may raise to reject a response before it is cached.
    `cached_only=True` behaves like offline mode for this one call.
    """
    key = json.dumps([method, url, data, json_body], sort_keys=True, default=str)
    path = _path(namespace, key, ext)
    meta_path = path.with_suffix(".meta.json")
    if path.exists() and not REFRESH:
        fetched_at = json.loads(meta_path.read_text())["fetched_at"] if meta_path.exists() else None
        if fetched_at:
            FETCH_LOG.append(fetched_at)
        return path.read_bytes(), fetched_at
    if OFFLINE or cached_only:
        raise CacheMiss(f"{namespace}: {url} not cached and SIATKA_OFFLINE=1")

    resp = requests.request(
        method,
        url,
        data=data,
        json=json_body,
        headers={"User-Agent": USER_AGENT, **(headers or {})},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    if validate:
        validate(resp.content)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(resp.content)
    meta_path.write_text(json.dumps({"url": url, "method": method, "fetched_at": fetched_at}))
    FETCH_LOG.append(fetched_at)
    return resp.content, fetched_at
