#!/usr/bin/env python3
"""Data catalog checks: every committed data file, source and metric must be in data/catalog.json.

Standard library only, like validate_data.py.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from fnmatch import fnmatch
from pathlib import Path
from typing import Any, Callable, Iterable

REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = "data/catalog.json"
DOC_PATH = "docs/data/katalog-danych.md"
# Committed data files the catalog must account for.
DATA_GLOBS = ("data/*", "application/public/data/*")
DATA_SUFFIXES = (".json", ".geojson")
NOT_DATA = ("data/scripts/*", CATALOG_PATH)


def _osiedla_metrics(content: dict[str, Any]) -> Iterable[str]:
    for osiedle in content.get("osiedla", {}).values():
        for key in osiedle.get("metrics", {}):
            yield f"osiedle.{key}"


def _kwartal_metrics(content: dict[str, Any]) -> Iterable[str]:
    """{<kwartał id>: {field: value | {subfield: value}}} -> kwartal.field[.subfield]."""
    for record in content.values():
        for field, value in record.items():
            if isinstance(value, dict):
                for sub in value:
                    yield f"kwartal.{field}.{sub}"
            else:
                yield f"kwartal.{field}"


def _osiedla_scores(content: dict[str, Any]) -> Iterable[str]:
    for entry in content.values():
        for key, value in entry.items():
            if key == "cats":
                yield from (f"kategoria.{c}" for c in value)
            elif key == "blurb":
                yield "osiedle.blurb"
            else:
                yield f"profil.{key}"


def _travel_grid(content: dict[str, Any]) -> Iterable[str]:
    for feature in content.get("features", []):
        for target, modes in feature.get("properties", {}).get("t", {}).items():
            yield from (f"komorka.travel.{target}.{mode}" for mode in modes)


# Output kind -> metric ids found in a file of that kind.
EXTRACTORS: dict[str, Callable[[dict[str, Any]], Iterable[str]]] = {
    "osiedla-metrics": _osiedla_metrics,
    "osiedla-scores": _osiedla_scores,
    "kwartal-metrics": _kwartal_metrics,
    "heat": lambda content: (f"heat.{p}" for p in content.get("profiles", [])),
    "heat-categories": lambda content: (f"heat.kategoria.{c}" for c in content.get("categories", [])),
    "travel-grid": _travel_grid,
    "traffic": lambda content: ["odcinek.spowolnienie_rozkladowe"],
}


def _walk(node: Any, path: str = "") -> Iterable[tuple[str, str, Any]]:
    """Yield (json path, key, value) for every key of every object, depth first."""
    if isinstance(node, dict):
        for key, value in node.items():
            here = f"{path}.{key}" if path else str(key)
            yield here, str(key), value
            yield from _walk(value, here)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            yield from _walk(value, f"{path}[{i}]")


def _strings(node: Any) -> Iterable[str]:
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for value in node.values():
            yield from _strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from _strings(value)


def _is_defined(metric_id: str, defined: set[str]) -> bool:
    return metric_id in defined or any(
        d.endswith(".*") and metric_id.startswith(d[:-1]) for d in defined
    )


def _check_entries(catalog: dict[str, Any]) -> list[str]:
    """Errors inside the catalog itself: policy violations and broken references."""
    errors: list[str] = []
    policy = catalog.get("policy", {})
    allowed_statuses = set(policy.get("allowedStatuses", []))
    allowed_kinds = set(policy.get("allowedSourceKinds", []))
    sources = {s["id"] for s in catalog.get("sources", [])}
    datasets = {d["id"] for d in catalog.get("datasets", [])}
    methods = {m["id"] for m in catalog.get("methods", [])}
    for source in catalog.get("sources", []):
        if source.get("kind") not in allowed_kinds:
            errors.append(f"catalog: source {source['id']} is of kind {source.get('kind')}, "
                          f"allowed: {', '.join(sorted(allowed_kinds))}")
    for dataset in catalog.get("datasets", []):
        if dataset.get("source") not in sources:
            errors.append(f"catalog: dataset {dataset['id']} has unknown source {dataset.get('source')}")
    for metric in catalog.get("metrics", []):
        for field in ("label", "definition", "unit"):
            if not metric.get(field):
                errors.append(f"catalog: metric {metric['id']} has no {field}")
        if metric.get("status") not in allowed_statuses:
            errors.append(f"catalog: metric {metric['id']} has status {metric.get('status')}, "
                          f"allowed: {', '.join(sorted(allowed_statuses))}")
        for ref in metric.get("datasets", []):
            if ref not in datasets:
                errors.append(f"catalog: metric {metric['id']} uses unknown dataset {ref}")
        if metric.get("method") and metric["method"] not in methods:
            errors.append(f"catalog: metric {metric['id']} uses unknown method {metric['method']}")
    for output in catalog.get("outputs", []):
        for ref in output.get("datasets", []):
            if ref not in datasets:
                errors.append(f"catalog: output {output['path']} uses unknown dataset {ref}")
    return errors


def validate_catalog(catalog: dict[str, Any], files: dict[str, Any]) -> list[str]:
    """Return a list of integrity errors; empty when catalog and data files agree.

    `files` maps repo-relative paths of data files to their parsed JSON.
    """
    errors = _check_entries(catalog)
    policy = catalog.get("policy", {})
    forbidden_keys = set(policy.get("forbiddenKeys", []))
    forbidden_names = [n.lower() for n in policy.get("forbiddenSourceNames", [])]
    defined = {m["id"] for m in catalog.get("metrics", [])}
    for path, content in sorted(files.items()):
        registered = [
            o for o in catalog.get("outputs", [])
            if fnmatch(path, o["path"]) and not any(fnmatch(path, x) for x in o.get("exclude", []))
        ]
        if not registered:
            errors.append(f"{path}: data file is not registered in the catalog (outputs)")
        for where, key, value in _walk(content):
            if key in forbidden_keys:
                errors.append(f"{path}: forbidden key {key} at {where}")
            # Only fields that describe where a value came from; plain links (e.g. buyUrl) are fine.
            if "source" in key.lower():
                text = " ".join(_strings(value)).lower()
                for name in forbidden_names:
                    if name in text:
                        errors.append(f"{path}: forbidden source {name} at {where}")
        for output in registered:
            extract = EXTRACTORS.get(output.get("kind", ""))
            if extract is None:
                continue
            for metric_id in sorted(set(extract(content))):
                if not _is_defined(metric_id, defined):
                    errors.append(f"{path}: metric {metric_id} is not defined in the catalog")
    return errors


SPATIAL_GROUPS = [
    ("miasto", "Cała Warszawa"),
    ("osiedle", "Osiedla (obszary MSI)"),
    ("kategoria", "Kategorie osiedli (0–100)"),
    ("profil", "Dopasowanie profili"),
    ("kwartal", "Kwartały"),
    ("komorka", "Komórki siatki"),
    ("heat", "Heatmapy"),
    ("odcinek", "Odcinki dróg (widok 3D)"),
]


def _cell(value: Any) -> str:
    if value is None or value == "" or value == []:
        return "–"
    if isinstance(value, list):
        value = ", ".join(str(v) for v in value)
    return str(value).replace("|", "\\|").replace("\n", " ")


def _table(header: list[str], rows: list[list[Any]]) -> list[str]:
    lines = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    lines += ["| " + " | ".join(_cell(v) for v in row) + " |" for row in rows]
    return lines + [""]


def render_catalog(catalog: dict[str, Any]) -> str:
    """Human-readable view of the catalog for docs/data/katalog-danych.md."""
    policy = catalog.get("policy", {})
    sources = {s["id"]: s for s in catalog.get("sources", [])}
    out = [
        "# Katalog danych",
        "",
        f"Generowane z [`{CATALOG_PATH}`](../../{CATALOG_PATH}) poleceniem "
        "`python3 data/scripts/data_catalog.py --render`. **Nie edytuj ręcznie**: zmieniaj katalog, "
        "a `python3 data/scripts/validate_data.py` sprawdzi, czy dane i ten plik się z nim zgadzają.",
        "",
        "## Zasady",
        "",
        f"- Dozwolone rodzaje źródeł: {_cell(policy.get('allowedSourceKinds'))}.",
        f"- Dozwolone statusy metryk: {_cell(policy.get('allowedStatuses'))} "
        "(REAL = wprost ze zbioru, DERIVED = jawny wzór na zbiorach).",
        f"- Zakazane pola: {_cell(policy.get('forbiddenKeys'))}; zakazane źródła: "
        f"{_cell(policy.get('forbiddenSourceNames'))}.",
        "- Brak danych to `null` z powodem, nigdy wartość zastępcza.",
        "",
        "## Źródła",
        "",
    ]
    out += _table(
        ["id", "Nazwa", "Rodzaj", "Licencja", "Adres"],
        [[s["id"], s.get("name"), s.get("kind"), s.get("licence"), s.get("url")] for s in sources.values()],
    )
    out += ["## Zbiory danych", ""]
    out += _table(
        ["id", "Zbiór", "Źródło", "Skrypt", "Stan danych", "Uwagi"],
        [[d["id"], d.get("title"), sources.get(d.get("source"), {}).get("name", d.get("source")),
          d.get("script"), d.get("period"), d.get("notes")] for d in catalog.get("datasets", [])],
    )
    out += ["## Metody", ""]
    out += _table(["id", "Definicja"], [[m["id"], m.get("definition")] for m in catalog.get("methods", [])])
    out += ["## Metryki", ""]
    metrics = catalog.get("metrics", [])
    listed = {prefix for prefix, _ in SPATIAL_GROUPS}
    groups = SPATIAL_GROUPS + [("", "Pozostałe")]
    for prefix, title in groups:
        group = [m for m in metrics if (m["id"].split(".")[0] == prefix if prefix else m["id"].split(".")[0] not in listed)]
        if not group:
            continue
        out += [f"### {title}", ""]
        out += _table(
            ["id", "Nazwa", "Definicja", "Jednostka", "Metoda", "Zbiory", "Status", "Zastrzeżenia"],
            [[m["id"], m.get("label"), m.get("definition"), m.get("unit"), m.get("method"),
              m.get("datasets"), m.get("status"), m.get("caveats")] for m in group],
        )
    out += ["## Założenia modelowe", ""]
    out += _table(
        ["id", "Założenie", "Uzasadnienie", "Gdzie"],
        [[a["id"], a.get("description"), a.get("justification"), a.get("where")]
         for a in catalog.get("assumptions", [])],
    )
    out += ["## Pliki z danymi", ""]
    out += _table(
        ["Plik", "Rodzaj", "Skrypt", "Zbiory"],
        [[o["path"], o.get("kind"), o.get("script"), o.get("datasets")] for o in catalog.get("outputs", [])],
    )
    return "\n".join(out).rstrip("\n") + "\n"


def check_rendered(catalog: dict[str, Any], doc_text: str | None) -> list[str]:
    if doc_text != render_catalog(catalog):
        return [f"{DOC_PATH}: out of date with {CATALOG_PATH}; run "
                "python3 data/scripts/data_catalog.py --render"]
    return []


def tracked_data_files(root: Path = REPO_ROOT) -> list[str]:
    """Committed data files (git ls-files), the set the catalog has to cover."""
    listed = subprocess.run(
        ["git", "ls-files", "--", *DATA_GLOBS], cwd=root, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    return sorted(
        p for p in listed
        if p.endswith(DATA_SUFFIXES) and not any(fnmatch(p, x) for x in NOT_DATA)
    )


def load_files(paths: Iterable[str], root: Path = REPO_ROOT) -> dict[str, Any]:
    return {p: json.loads((root / p).read_text(encoding="utf-8")) for p in paths}


def check_repo(root: Path = REPO_ROOT) -> list[str]:
    catalog = json.loads((root / CATALOG_PATH).read_text(encoding="utf-8"))
    doc = root / DOC_PATH
    errors = validate_catalog(catalog, load_files(tracked_data_files(root), root))
    return errors + check_rendered(catalog, doc.read_text(encoding="utf-8") if doc.exists() else None)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check data files against data/catalog.json")
    parser.add_argument("--render", action="store_true", help=f"write {DOC_PATH} from the catalog")
    args = parser.parse_args()
    if args.render:
        catalog = json.loads((REPO_ROOT / CATALOG_PATH).read_text(encoding="utf-8"))
        (REPO_ROOT / DOC_PATH).write_text(render_catalog(catalog), encoding="utf-8")
        print(f"Wrote {DOC_PATH}")
        return 0
    errors = check_repo()
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    print(f"{len(errors)} catalog errors" if errors else "OK: data matches the catalog")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
