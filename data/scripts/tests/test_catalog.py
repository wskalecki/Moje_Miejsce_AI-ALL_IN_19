"""Behaviour of the data catalog checks (data/catalog.json, docs/data/katalog-danych.md).

Run from the repo root:
    uv run --with pytest pytest data/scripts/tests/test_catalog.py -q
"""

import copy
import pytest
import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "data_catalog.py"
_spec = importlib.util.spec_from_file_location("data_catalog", SCRIPT)
data_catalog = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(data_catalog)

METRICS_FILE = "application/public/data/osiedla-metrics.json"

CATALOG = {
    "schemaVersion": 1,
    "policy": {
        "allowedSourceKinds": ["city", "public", "open"],
        "allowedStatuses": ["REAL", "DERIVED"],
        "forbiddenKeys": ["scrapedAt"],
        "forbiddenSourceNames": ["otodom"],
        "personas": ["student"],
    },
    "sources": [
        {
            "id": "um_portal",
            "name": "Portal otwartych danych m.st. Warszawy",
            "kind": "city",
            "url": "https://dane.um.warszawa.pl",
            "licence": "CC BY — Urząd m.st. Warszawy",
        }
    ],
    "datasets": [
        {"id": "um_aed", "source": "um_portal", "title": "Defibrylatory AED", "script": "data/scripts/etl_aed.py"}
    ],
    "methods": [{"id": "count_1km", "definition": "liczba obiektów w promieniu 1 km od punktu odniesienia"}],
    "metrics": [
        {
            "id": "osiedle.aed_1km",
            "label": "Defibrylatory AED w 1 km",
            "definition": "Liczba defibrylatorów AED w promieniu 1 km od punktu odniesienia osiedla.",
            "unit": "szt.",
            "method": "count_1km",
            "datasets": ["um_aed"],
            "status": "DERIVED",
        }
    ],
    "assumptions": [],
    "outputs": [
        {
            "path": METRICS_FILE,
            "kind": "osiedla-metrics",
            "script": "data/scripts/build_osiedle_metrics.py",
            "datasets": ["um_aed"],
        }
    ],
}


def osiedla_metrics(**metrics):
    return {
        "meta": {"generated_at": "2026-10-17T12:00:00+02:00", "script": "data/scripts/build_osiedle_metrics.py"},
        "osiedla": {"muranow": {"metrics": metrics}},
    }


AED = {"value": 3, "unit": "szt.", "source": "um_aed", "method": "count_1km"}


def catalog(**changes):
    result = copy.deepcopy(CATALOG)
    result.update(changes)
    return result


def test_consistent_catalog_and_files_have_no_errors():
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    assert data_catalog.validate_catalog(catalog(), files) == []


def errors_mentioning(errors, *words):
    return [e for e in errors if all(w in e for w in words)]


def test_metric_in_a_file_but_not_in_the_catalog_is_reported():
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED, made_up_score={"value": 97, "unit": "%"})}

    errors = data_catalog.validate_catalog(catalog(), files)

    assert errors_mentioning(errors, "osiedle.made_up_score", METRICS_FILE)


def test_data_file_not_registered_in_the_catalog_is_reported():
    sample = "data/samples/cell_metrics_sample.json"
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED), sample: {"cells": {}}}

    errors = data_catalog.validate_catalog(catalog(), files)

    assert errors_mentioning(errors, sample, "not registered")


FEATURED = "data/featured/muranow.json"
FEATURED_OUTPUT = {"path": "data/featured/*.json", "kind": "curated", "script": "manual", "datasets": ["um_aed"]}


def test_scraped_values_are_reported():
    files = {FEATURED: {"prices": {"buy": {"meanPerM2": 21200, "scrapedAt": "2026-10-17"}}}}

    errors = data_catalog.validate_catalog(catalog(outputs=[FEATURED_OUTPUT]), files)

    assert errors_mentioning(errors, FEATURED, "scrapedAt", "prices.buy")


def test_values_sourced_from_forbidden_portals_are_reported():
    files = {FEATURED: {"prices": {"buy": {"sourceUrls": ["https://www.otodom.pl/pl/wyniki/sprzedaz"]},
                                    "sourceNote": "Średnia z 140 ofert na Otodom"}}}

    errors = data_catalog.validate_catalog(catalog(outputs=[FEATURED_OUTPUT]), files)

    assert errors_mentioning(errors, FEATURED, "otodom", "prices.buy.sourceUrls")
    assert errors_mentioning(errors, FEATURED, "otodom", "prices.sourceNote")


def with_metric(**changes):
    metric = {**CATALOG["metrics"][0], **changes}
    return catalog(metrics=[metric])


def test_estimated_or_made_up_metric_breaks_the_policy():
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    errors = data_catalog.validate_catalog(with_metric(status="ESTIMATED"), files)

    assert errors_mentioning(errors, "osiedle.aed_1km", "ESTIMATED")


def test_metric_must_come_from_a_registered_dataset():
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    errors = data_catalog.validate_catalog(with_metric(datasets=["um_aed", "my_guess"]), files)

    assert errors_mentioning(errors, "osiedle.aed_1km", "my_guess")


def test_dataset_must_come_from_a_registered_source():
    dataset = {**CATALOG["datasets"][0], "source": "otodom"}
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    errors = data_catalog.validate_catalog(catalog(datasets=[dataset]), files)

    assert errors_mentioning(errors, "um_aed", "otodom")


def test_source_of_a_kind_outside_the_policy_is_reported():
    source = {**CATALOG["sources"][0], "kind": "commercial"}
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    errors = data_catalog.validate_catalog(catalog(sources=[source]), files)

    assert errors_mentioning(errors, "um_portal", "commercial")


def test_metric_without_a_definition_or_unit_is_reported():
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    errors = data_catalog.validate_catalog(with_metric(definition="", unit=None), files)

    assert errors_mentioning(errors, "osiedle.aed_1km", "definition")
    assert errors_mentioning(errors, "osiedle.aed_1km", "unit")


KWARTAL = "application/public/data/fine-metrics/muranow.json"
SCORES = "application/public/data/osiedla-scores.json"
HEAT = "application/public/data/heat.json"
HEAT_CATEGORIES = "application/public/data/heat-categories.json"
TRAVEL = "data/grid/czasy_przejazdu.geojson"
TRAFFIC = "application/public/data/3d/muranow/traffic.json"


@pytest.mark.parametrize(
    "kind, path, content, undefined",
    [
        ("kwartal-metrics", KWARTAL,
         {"muranow--kw1": {"price": {"med": 18844, "n": 12}, "noise": [0.2, 0.1, 0.0]}},
         {"kwartal.price.med", "kwartal.price.n", "kwartal.noise"}),
        ("osiedla-scores", SCORES,
         {"muranow": {"student": 92, "cats": {"cisza": 51}, "blurb": {"student": "…"}}},
         {"profil.student", "kategoria.cisza", "osiedle.blurb"}),
        ("heat", HEAT, {"profiles": ["student"], "points": []}, {"heat.student"}),
        ("heat-categories", HEAT_CATEGORIES, {"categories": ["cisza"], "points": []}, {"heat.kategoria.cisza"}),
        ("travel-grid", TRAVEL,
         {"features": [{"properties": {"id": "cell_r001_c001", "t": {"centrum": {"metro": [12, 10, 14, 10]}}}}]},
         {"komorka.travel.centrum.metro"}),
        ("traffic", TRAFFIC, {"hours": [], "ways": []}, {"odcinek.spowolnienie_rozkladowe"}),
    ],
)
def test_each_output_kind_exposes_its_metrics(kind, path, content, undefined):
    output = {"path": path, "kind": kind, "script": "x.py", "datasets": ["um_aed"]}

    errors = data_catalog.validate_catalog(catalog(outputs=[output]), {path: content})

    reported = {e.split("metric ")[1].split(" ")[0] for e in errors_mentioning(errors, path, "not defined")}
    assert reported == undefined


def test_wildcard_metric_covers_subtypes():
    output = {"path": KWARTAL, "kind": "kwartal-metrics", "script": "x.py", "datasets": ["um_aed"]}
    near = {**CATALOG["metrics"][0], "id": "kwartal.near.*"}
    content = {"muranow--kw1": {"near": {"kindergarten": ["Przedszkole nr 1", 120], "metro": ["Muranowska", 410]}}}

    errors = data_catalog.validate_catalog(catalog(outputs=[output], metrics=[near]), {KWARTAL: content})

    assert errors == []


def test_excluded_file_is_not_read_as_that_output_kind():
    index = "application/public/data/fine-metrics/index.json"
    outputs = [
        {"path": "application/public/data/fine-metrics/*.json", "exclude": [index],
         "kind": "kwartal-metrics", "script": "x.py", "datasets": ["um_aed"]},
        {"path": index, "kind": "schema", "script": "x.py", "datasets": ["um_aed"]},
    ]
    files = {index: {"metadata": {"schema": {}}, "areas": {"muranow": {"n": 38}}}}

    assert data_catalog.validate_catalog(catalog(outputs=outputs), files) == []


def test_rendered_doc_shows_each_metric_with_its_definition_and_source():
    doc = data_catalog.render_catalog(catalog())

    assert "osiedle.aed_1km" in doc
    assert "Liczba defibrylatorów AED w promieniu 1 km od punktu odniesienia osiedla." in doc
    assert "Portal otwartych danych m.st. Warszawy" in doc


def test_doc_out_of_date_with_the_catalog_is_reported():
    errors = data_catalog.check_rendered(catalog(), "# Katalog danych\n\nstara wersja\n")

    assert errors_mentioning(errors, "katalog-danych.md", "--render")
    assert data_catalog.check_rendered(catalog(), data_catalog.render_catalog(catalog())) == []


def test_output_and_method_references_must_exist():
    output = {**CATALOG["outputs"][0], "datasets": ["um_aed", "scraped_prices"]}
    files = {METRICS_FILE: osiedla_metrics(aed_1km=AED)}

    errors = data_catalog.validate_catalog(catalog(outputs=[output], metrics=[{**CATALOG["metrics"][0], "method": "eyeballed"}]), files)

    assert errors_mentioning(errors, METRICS_FILE, "scraped_prices")
    assert errors_mentioning(errors, "osiedle.aed_1km", "eyeballed")


def test_every_metric_appears_in_the_doc_even_with_an_unlisted_prefix():
    other = {**CATALOG["metrics"][0], "id": "dzielnica.liczba_mieszkancow", "label": "Liczba mieszkańców"}

    doc = data_catalog.render_catalog(catalog(metrics=[CATALOG["metrics"][0], other]))

    assert "dzielnica.liczba_mieszkancow" in doc


def test_file_built_on_another_grid_version_is_reported():
    output = {"path": HEAT, "kind": "heat", "script": "x.py", "datasets": ["um_aed"]}
    policy = {**CATALOG["policy"], "gridVersion": 3}
    heat = {"profiles": [], "points": [], "grid": {"version": 2, "cellSizeM": 200}}
    travel = {"metadata": {"gridVersion": 3}, "features": []}
    travel_output = {"path": TRAVEL, "kind": "travel-grid", "script": "x.py", "datasets": ["um_aed"]}

    errors = data_catalog.validate_catalog(catalog(policy=policy, outputs=[output, travel_output]), {HEAT: heat, TRAVEL: travel})

    assert errors_mentioning(errors, HEAT, "grid version 2")
    assert not errors_mentioning(errors, TRAVEL)


def test_history_of_data_changes_is_rendered():
    history = [{"date": "2026-10-17", "change": "Usunięto ceny ofertowe scrapowane z portali", "why": "brak oficjalnego źródła"}]

    doc = data_catalog.render_catalog(catalog(history=history))

    assert "Usunięto ceny ofertowe scrapowane z portali" in doc
    assert "brak oficjalnego źródła" in doc
