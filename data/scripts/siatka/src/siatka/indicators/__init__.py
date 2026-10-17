"""Indicator modules. Each module registers datasets (@dataset) and exposes INDICATORS.

To add data: create a new module here — it is discovered automatically.
"""

from __future__ import annotations

import importlib
import pkgutil

from siatka.indicator import Indicator


def discover() -> list[Indicator]:
    found: list[Indicator] = []
    for mod in sorted(pkgutil.iter_modules(__path__), key=lambda m: m.name):
        module = importlib.import_module(f"{__name__}.{mod.name}")
        found.extend(getattr(module, "INDICATORS", []))
    keys = [i.key for i in found]
    duplicates = {k for k in keys if keys.count(k) > 1}
    if duplicates:
        raise ValueError(f"Duplicate indicator keys: {sorted(duplicates)}")
    return found
