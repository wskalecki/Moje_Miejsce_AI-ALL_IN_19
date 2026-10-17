import geopandas as gpd
import pandas as pd
import pytest
from shapely.geometry import box

from warsaw_noise import area_by_band, band_summary

CRS = "EPSG:2180"


def contours(*rows):
    """rows: (source, indicator, band_min_db, band_max_db, geometry)"""
    return gpd.GeoDataFrame(
        [
            {
                "source": source,
                "indicator": indicator,
                "band_min_db": band_min,
                "band_max_db": band_max,
                "geometry": geom,
            }
            for source, indicator, band_min, band_max, geom in rows
        ],
        crs=CRS,
    )


def zones(**named):
    return gpd.GeoDataFrame(
        {"cell_id": list(named)}, geometry=list(named.values()), crs=CRS
    )


def row(table, cell_id, source, indicator, band_min_db):
    return table[
        (table.cell_id == cell_id)
        & (table.source == source)
        & (table.indicator == indicator)
        & (table.band_min_db == band_min_db)
    ].iloc[0]


def test_band_area_is_split_between_zones_and_shared_by_real_zone_area():
    cells = zones(A=box(0, 0, 1000, 1000), B=box(1000, 0, 1500, 1000))
    noise = contours(("road", "lden", 60, 64, box(500, 0, 1500, 1000)))

    by_band = area_by_band(noise, cells, "cell_id")

    a = row(by_band, "A", "road", "lden", 60)
    b = row(by_band, "B", "road", "lden", 60)
    assert (a.area_m2, a.area_share) == pytest.approx((500_000, 0.5))
    assert (b.area_m2, b.area_share) == pytest.approx((500_000, 1.0))


def test_open_ended_top_band_is_counted():
    cells = zones(A=box(0, 0, 1000, 1000))
    noise = contours(("road", "lden", 75, None, box(0, 0, 100, 1000)))

    by_band = area_by_band(noise, cells, "cell_id")

    assert row(by_band, "A", "road", "lden", 75).area_share == pytest.approx(0.1)


def summary_of(summary, cell_id, source, indicator):
    s = summary[
        (summary.cell_id == cell_id)
        & (summary.source == source)
        & (summary.indicator == indicator)
    ].iloc[0]
    return s.dominant_band_min_db, s.max_band_min_db


def test_summary_names_the_band_covering_most_area_and_the_loudest_band():
    cells = zones(A=box(0, 0, 1000, 1000))
    noise = contours(
        ("road", "lden", 55, 59, box(0, 0, 400, 1000)),
        ("road", "lden", 60, 64, box(400, 0, 700, 1000)),
        ("road", "lden", 65, 69, box(700, 0, 800, 1000)),
    )

    summary = band_summary(area_by_band(noise, cells, "cell_id"), "cell_id")

    assert summary_of(summary, "A", "road", "lden") == (55, 65)


def test_mostly_quiet_cell_has_no_dominant_band():
    cells = zones(A=box(0, 0, 1000, 1000))
    noise = contours(("road", "lden", 55, 59, box(0, 0, 300, 1000)))

    summary = band_summary(area_by_band(noise, cells, "cell_id"), "cell_id")

    dominant, loudest = summary_of(summary, "A", "road", "lden")
    assert pd.isna(dominant)
    assert loudest == 55
