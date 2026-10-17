import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, box

from warsaw_noise import noise_at

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


def places(**named_points):
    return gpd.GeoDataFrame(
        {"address": list(named_points)}, geometry=list(named_points.values()), crs=CRS
    )


def band(result, address, source, indicator):
    row = result[
        (result.address == address)
        & (result.source == source)
        & (result.indicator == indicator)
    ].iloc[0]
    return row.band_min_db, row.band_max_db


def test_address_inside_a_contour_gets_its_band():
    noise = contours(("road", "lden", 60, 64, box(0, 0, 100, 100)))

    result = noise_at(places(home=Point(50, 50)), noise)

    assert band(result, "home", "road", "lden") == (60, 64)


def test_address_outside_every_contour_is_below_the_lowest_reported_band():
    noise = contours(
        ("road", "lden", 60, 64, box(0, 0, 100, 100)),
        ("road", "lnight", 50, 54, box(0, 0, 10, 10)),
    )

    result = noise_at(places(home=Point(50, 50)), noise)

    band_min, band_max = band(result, "home", "road", "lnight")
    assert pd.isna(band_min) and pd.isna(band_max)


def test_addresses_in_lon_lat_are_matched_against_metric_contours():
    palace_of_culture = gpd.GeoDataFrame(
        {"address": ["pkin"]}, geometry=[Point(21.0060, 52.2318)], crs="EPSG:4326"
    )
    noise = contours(("road", "lden", 70, 74, box(636000, 486000, 638000, 488000)))

    result = noise_at(palace_of_culture, noise)

    assert band(result, "pkin", "road", "lden") == (70, 74)


def test_address_on_the_edge_between_two_bands_gets_the_louder_one():
    noise = contours(
        ("road", "lden", 55, 59, box(0, 0, 100, 100)),
        ("road", "lden", 60, 64, box(100, 0, 200, 100)),
    )

    result = noise_at(places(home=Point(100, 50)), noise)

    assert len(result) == 1
    assert band(result, "home", "road", "lden") == (60, 64)
