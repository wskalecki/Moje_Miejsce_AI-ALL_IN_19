"""Persona scores and the 'dlaczego tu' narrative from normalised metrics."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from siatka.indicator import Indicator

MIN_WEIGHT_COVERAGE = 0.4  # need data for at least 40% of a persona's total weight


def persona_score(norms: dict[str, int | None], weights: dict[str, float]) -> int | None:
    """Weighted mean of available normalised metrics; None if too little data."""
    total_weight = sum(weights.values())
    used = {k: w for k, w in weights.items() if norms.get(k) is not None}
    if not used or sum(used.values()) < MIN_WEIGHT_COVERAGE * total_weight:
        return None
    return int(round(sum(norms[k] * w for k, w in used.items()) / sum(used.values())))


def format_value(value: float, unit: str) -> str:
    if unit == "m":
        return f"{value / 1000:.1f} km".replace(".", ",") if value >= 1000 else f"{int(round(value, -1))} m"
    if unit == "zł/m²":
        return f"{int(round(value, -2)):,} zł/m²".replace(",", " ")
    text = f"{value:g}".replace(".", ",")
    return f"{text} {unit}".strip()


def narrative(
    metrics: dict[str, float | None],
    norms: dict[str, int | None],
    weights: dict[str, float],
    indicators: dict[str, Indicator],
) -> list[str]:
    """Three Polish sentences: two strongest points and the weakest one that matters to the persona."""
    scored = [
        (k, norms[k], w)
        for k, w in weights.items()
        if k in indicators and norms.get(k) is not None and metrics.get(k) is not None
    ]
    if not scored:
        return []
    pros = sorted(scored, key=lambda t: (t[1] * t[2], t[2]), reverse=True)[:2]
    pros = [p for p in pros if p[1] >= 50]
    cons = sorted((t for t in scored if t[2] >= 1.5 and t not in pros), key=lambda t: t[1])[:1]
    cons = [c for c in cons if c[1] < 50]

    def sentence(key: str, positive: bool) -> str:
        ind = indicators[key]
        value = format_value(metrics[key], ind.unit)
        verdict = "mocna strona" if positive else "słabsza strona"
        return f"{ind.label}: {value} — {verdict}."

    return [sentence(k, True) for k, _, _ in pros] + [sentence(k, False) for k, _, _ in cons]
