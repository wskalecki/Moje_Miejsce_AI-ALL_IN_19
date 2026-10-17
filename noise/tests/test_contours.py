import geopandas as gpd
from shapely.geometry import Polygon, box

from warsaw_noise import clean_contours

CRS = "EPSG:2180"
CITY = gpd.GeoDataFrame(geometry=[box(0, 0, 1000, 1000)], crs=CRS)


def contours(*rows):
    """rows: (source, indicator, band_min_db, band_max_db, geometry)"""
    return gpd.GeoDataFrame(
        [
            {
                "source": source,
                "indicator": indicator,
                "band_min_db": band_min,
                "band_max_db": band_max,
                "data_year": 2021,
                "mapping_round": 2022,
                "origin": "eea_end_2022",
                "geometry": geom,
            }
            for source, indicator, band_min, band_max, geom in rows
        ],
        crs=CRS,
    )


def area_of(result, source, indicator, band_min_db):
    rows = result[
        (result.source == source)
        & (result.indicator == indicator)
        & (result.band_min_db == band_min_db)
    ]
    return rows.area.sum()


def test_higher_band_wins_where_bands_of_one_source_overlap():
    raw = contours(
        ("road", "lden", 55, 59, box(0, 0, 100, 100)),
        ("road", "lden", 60, 64, box(50, 0, 100, 100)),
    )

    clean = clean_contours(raw, CITY)

    assert area_of(clean, "road", "lden", 55) == 5000
    assert area_of(clean, "road", "lden", 60) == 5000


def test_contours_are_clipped_to_city():
    raw = contours(("road", "lden", 55, 59, box(900, 0, 1200, 100)))

    clean = clean_contours(raw, CITY)

    assert area_of(clean, "road", "lden", 55) == 100 * 100


def test_self_intersecting_contours_are_repaired():
    bowtie = Polygon([(0, 0), (100, 100), (100, 0), (0, 100)])
    raw = contours(("road", "lden", 55, 59, bowtie))

    clean = clean_contours(raw, CITY)

    assert clean.is_valid.all()
    assert area_of(clean, "road", "lden", 55) == 5000


def test_all_sources_max_keeps_the_loudest_band_from_any_source():
    raw = contours(
        ("road", "lden", 55, 59, box(0, 0, 100, 100)),
        ("tram", "lden", 65, 69, box(50, 0, 100, 100)),
    )

    clean = clean_contours(raw, CITY)

    assert area_of(clean, "all_sources_max", "lden", 55) == 5000
    assert area_of(clean, "all_sources_max", "lden", 65) == 5000
    assert area_of(clean, "road", "lden", 55) == 10000
