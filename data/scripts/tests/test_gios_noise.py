"""Behaviour of the GIOŚ noise unions (data/scripts/noise/gios_noise.py).

Run from the repo root:
    uv run --with pytest --with shapely --with pyproj pytest data/scripts/tests/test_gios_noise.py -q
"""

import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "noise" / "gios_noise.py"
_spec = importlib.util.spec_from_file_location("gios_noise", SCRIPT)
gios_noise = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gios_noise)


def test_band_lower_bound_is_read_for_day_and_night_indicators():
    assert gios_noise.band_min_db("Lden6064") == 60
    assert gios_noise.band_min_db("LdenGreaterThan80") == 80
    assert gios_noise.band_min_db("Lnight5054") == 50
    assert gios_noise.band_min_db("LnightGreaterThan75") == 75


def test_threshold_union_keeps_louder_bands_inside_the_city():
    from shapely.geometry import box

    city = box(0, 0, 100, 100)
    bands = {
        "road": [(50, box(0, 0, 50, 100)), (60, box(50, 0, 150, 100))],  # half of the 60 band lies outside the city
        "rail": [(55, box(0, 0, 100, 10))],
    }

    unions = gios_noise.unions_by_threshold(bands, city, (50, 55, 60))

    assert unions["road"][50].area == 100 * 100
    assert unions["road"][55].area == 50 * 100
    assert unions["rail"][60].is_empty
    assert unions["any"][55].area == 50 * 100 + 50 * 10
