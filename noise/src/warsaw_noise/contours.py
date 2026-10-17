import geopandas as gpd
import pandas as pd

BAND_KEYS = ["source", "indicator", "band_min_db"]
ALL_SOURCES_MAX = "all_sources_max"


def clean_contours(contours: gpd.GeoDataFrame, boundary: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """One non-overlapping polygon per source × indicator × band, plus an
    `all_sources_max` source holding the loudest band of any source."""
    contours = contours.set_geometry(contours.make_valid())
    per_source = _louder_band_wins(contours.clip(boundary))
    loudest = _louder_band_wins(per_source.assign(source=ALL_SOURCES_MAX))
    return pd.concat([per_source, loudest], ignore_index=True)


def _louder_band_wins(contours: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    bands = contours.dissolve(by=BAND_KEYS, as_index=False)
    cleaned = []
    for _, group in bands.groupby(["source", "indicator"]):
        louder = None
        for _, band in group.sort_values("band_min_db", ascending=False).iterrows():
            geom = band.geometry
            if louder is not None:
                geom = geom.difference(louder)
                louder = louder.union(band.geometry)
            else:
                louder = band.geometry
            cleaned.append({**band.drop("geometry").to_dict(), "geometry": geom})
    return gpd.GeoDataFrame(pd.DataFrame(cleaned), geometry="geometry", crs=contours.crs)
