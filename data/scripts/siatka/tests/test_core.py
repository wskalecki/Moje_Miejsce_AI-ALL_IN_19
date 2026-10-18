import json

import numpy as np
import pytest

from siatka.geo import count_within, idw, nearest_distance, to_xy
from siatka.grid import Grid, gen
from siatka.indicator import CountWithin, NearestDistance
from siatka.model import POI
from siatka.pipeline import Context
from siatka.scoring import format_value, narrative, persona_score


@pytest.fixture(scope="module")
def grid():
    return Grid.build()


def test_grid_covers_warsaw_with_contract_ids(grid):
    assert len(grid.cells) == 8572  # 250 m team grid (gridVersion 3), Warsaw only
    assert all(c.district for c in grid.cells)
    # Pałac Kultury lands in Śródmieście with the same ID as the team's assign_cell
    cid = grid.assign(21.0067, 52.2318)
    assert cid == gen.assign_cell(21.0067, 52.2318)
    assert grid.cells[grid.index[cid]].district == "Śródmieście"
    assert grid.assign(20.0, 52.0) is None


def test_distance_helpers_in_metres():
    a = to_xy([21.0, 21.0], [52.2, 52.3])
    b = to_xy([21.0], [52.209])  # ~1 km north of the first point
    d = nearest_distance(a, b)
    assert 950 < d[0] < 1050
    assert count_within(a, b, 1100).tolist() == [1, 0]
    assert np.isnan(nearest_distance(a, np.empty((0, 2)))).all()
    v = idw(a, np.vstack([b, b]), np.array([2.0, 4.0]))
    assert v[0] == pytest.approx(3.0)
    assert np.isnan(v[1])  # farther than max_distance


def test_normalise_follows_direction_and_clamps():
    dist = NearestDistance(key="x", label="x", category="zdrowie", good=300, bad=1500)
    assert dist.normalise(100) == 100
    assert dist.normalise(900) == 50
    assert dist.normalise(5000) == 0
    assert dist.normalise(None) is None
    count = CountWithin(key="y", label="y", category="sport", good=10, bad=0)
    assert count.normalise(5) == 50


def test_persona_score_skips_missing_and_needs_coverage():
    weights = {"a": 3, "b": 1}
    assert persona_score({"a": 80, "b": 40}, weights) == 70
    assert persona_score({"a": 80, "b": None}, weights) == 80
    assert persona_score({"a": None, "b": 40}, weights) is None  # only 25% of weight covered


def test_indicator_on_grid_with_fake_dataset(grid, monkeypatch):
    ctx = Context(grid=grid)
    ctx._pois["fake"] = [
        POI(source_key="t", source_id="1", category="amenity", subtype="toilet", lon=21.0067, lat=52.2318)
    ]
    ind = NearestDistance(key="toilet_dist_m", label="t", category="codziennosc", good=200, bad=2000, datasets=("fake",))
    values = ind.compute(ctx)
    pkin = grid.assign(21.0067, 52.2318)
    assert values[pkin] < 800
    assert max(v for v in values.values() if v is not None) > 10_000 - 1
    assert all(isinstance(v, int) for v in values.values())


def test_narrative_mentions_strengths_and_weakness():
    a = NearestDistance(key="a", label="Najbliższa apteka", category="zdrowie", good=300, bad=1500)
    b = NearestDistance(key="b", label="Najbliższy park lub las", category="srodowisko", good=200, bad=1500)
    c = NearestDistance(key="c", label="Najbliższe przedszkole", category="edukacja", good=400, bad=2000)
    metrics = {"a": 250, "b": 150, "c": 2600}
    norms = {k: ind.normalise(metrics[k]) for k, ind in zip("abc", (a, b, c))}
    out = narrative(metrics, norms, {"a": 2, "b": 2, "c": 3}, {"a": a, "b": b, "c": c})
    assert len(out) == 3
    assert "słabsza strona" in out[-1] and "2,6 km" in out[-1]


def test_format_value():
    assert format_value(340, "m") == "340 m"
    assert format_value(1250, "m") == "1,2 km"
    assert format_value(15234, "zł/m²") == "15 200 zł/m²"


def test_poi_feature_matches_contract():
    p = POI(source_key="osm", source_id="n1", category="education", subtype="kindergarten", lon=21, lat=52.2)
    p.cell_id = "cell_r011_c010"
    props = p.to_feature()["properties"]
    assert props["id"] == "osm_n1"
    for key in ("id", "category", "subtype", "source", "sourceId", "cell_id"):
        assert key in props
    with pytest.raises(ValueError):
        POI(source_key="x", source_id="1", category="nope", subtype="x", lon=0, lat=0)
    json.dumps(p.to_feature())
