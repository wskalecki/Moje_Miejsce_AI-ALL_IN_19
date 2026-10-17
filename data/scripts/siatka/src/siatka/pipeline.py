"""Run indicators over the grid and produce contract-compliant outputs."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from siatka.grid import Grid
from siatka.indicator import Indicator
from siatka.model import DATASETS, POI
from siatka.personas import PERSONAS
from siatka.scoring import narrative, persona_score
from siatka.sources import cache

log = logging.getLogger("siatka")


@dataclass
class Context:
    grid: Grid
    _pois: dict[str, list[POI]] = field(default_factory=dict)
    failures: dict[str, str] = field(default_factory=dict)  # dataset key -> error

    def pois(self, key: str) -> list[POI]:
        """POIs of a dataset inside the Warsaw grid (fetched once per run)."""
        if key in self._pois:
            return self._pois[key]
        ds = DATASETS[key]
        cache.FETCH_LOG.clear()
        try:
            raw = ds.fetch()
        except Exception as exc:  # one broken source must not stop the run
            log.warning("dataset %s unavailable: %s", key, exc)
            self.failures[key] = f"{type(exc).__name__}: {exc}"
            raw = []
        ds.fetched_at = max(cache.FETCH_LOG) if cache.FETCH_LOG else None
        kept = []
        for p in raw:
            p.cell_id = self.grid.assign(p.lon, p.lat)
            if p.cell_id:
                kept.append(p)
        self._pois[key] = kept
        log.info("dataset %-28s %5d POI (%d outside grid)", key, len(kept), len(raw) - len(kept))
        return kept

    def source_info(self, key: str) -> dict[str, Any]:
        ds = DATASETS[key]
        s = ds.source
        return {
            "dataset": key,
            "name": s.name,
            "url": s.url,
            "license": s.license,
            "slug": s.slug,
            "cityOpenData": s.city_open_data,
            "fetchedAt": ds.fetched_at,
            "error": self.failures.get(key),
        }


@dataclass
class Result:
    ctx: Context
    indicators: list[Indicator]
    metrics: dict[str, dict[str, Any]]  # cell -> key -> value
    norms: dict[str, dict[str, int | None]]
    scores: dict[str, dict[str, int | None]]
    narratives: dict[str, dict[str, list[str]]]  # cell -> persona -> sentences
    generated_at: str


def run(indicators: list[Indicator], grid: Grid | None = None) -> Result:
    ctx = Context(grid=grid or Grid.build())
    metrics: dict[str, dict[str, Any]] = {cid: {} for cid in ctx.grid.ids}
    norms: dict[str, dict[str, int | None]] = {cid: {} for cid in ctx.grid.ids}

    for ind in indicators:
        try:
            values = ind.compute(ctx)
        except Exception as exc:
            log.warning("indicator %s failed: %s", ind.key, exc)
            values = {cid: None for cid in ctx.grid.ids}
        filled = sum(v is not None for v in values.values())
        log.info("indicator %-28s %4d/%d cells", ind.key, filled, len(values))
        for cid, v in values.items():
            metrics[cid][ind.key] = v
            norms[cid][ind.key] = ind.normalise(v)

    by_key = {i.key: i for i in indicators}
    scores, narratives = {}, {}
    for cid in ctx.grid.ids:
        scores[cid] = {p: persona_score(norms[cid], cfg["weights"]) for p, cfg in PERSONAS.items()}
        narratives[cid] = {
            p: narrative(metrics[cid], norms[cid], cfg["weights"], by_key) for p, cfg in PERSONAS.items()
        }

    return Result(
        ctx=ctx,
        indicators=indicators,
        metrics=metrics,
        norms=norms,
        scores=scores,
        narratives=narratives,
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
