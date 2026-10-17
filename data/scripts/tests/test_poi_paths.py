"""City API ETL outputs stay out of the siatka pipeline's data/poi/ (same file names there).

Run from the repo root:
    uv run --with pytest --with pyproj pytest data/scripts/tests -q
"""

import importlib
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from poi_common import POI_DIR  # noqa: E402
from um_api import DATA_DIR  # noqa: E402

POI_ETLS = ["etl_aed", "etl_boiska", "etl_budzet_obywatelski", "etl_ekopunkty", "etl_gtfs_przystanki",
            "etl_parkingi", "etl_pogoda", "etl_powietrze", "etl_przystanki", "etl_toalety", "etl_wydarzenia",
            "etl_zajecia_sportowe"]


def test_poi_dir_is_the_imported_folder_not_siatka():
    assert POI_DIR == DATA_DIR / "poi_mikolaj"
    assert POI_DIR != DATA_DIR / "poi"


@pytest.mark.parametrize("name", POI_ETLS)
def test_each_poi_etl_writes_to_poi_mikolaj(name):
    assert importlib.import_module(name).OUT_PATH.parent == POI_DIR


def test_every_poi_etl_is_listed():
    writers = {p.stem for p in SCRIPTS.glob("etl_*.py") if "POI_DIR /" in p.read_text(encoding="utf-8")}
    assert writers == set(POI_ETLS)
