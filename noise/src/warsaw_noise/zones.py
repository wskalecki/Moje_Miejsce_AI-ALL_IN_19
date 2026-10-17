import geopandas as gpd
import pandas as pd

BAND_COLUMNS = ["source", "indicator", "band_min_db", "band_max_db"]


def area_by_band(
    contours: gpd.GeoDataFrame, zones: gpd.GeoDataFrame, zone_id: str
) -> pd.DataFrame:
    """Area of each noise band within each zone (grid cell, district, ...).

    `area_share` is relative to the zone's own area, so clipped edge cells
    are not diluted."""
    zones = zones[[zone_id, "geometry"]].assign(zone_area=zones.area)
    pieces = gpd.overlay(zones, contours[BAND_COLUMNS + ["geometry"]], how="intersection")
    pieces["area_m2"] = pieces.area
    table = pieces.groupby(
        [zone_id, *BAND_COLUMNS, "zone_area"], as_index=False, dropna=False
    )["area_m2"].sum()
    table["area_share"] = table.area_m2 / table.zone_area
    return table.drop(columns="zone_area")


def band_summary(by_band: pd.DataFrame, zone_id: str) -> pd.DataFrame:
    """Per zone × source × indicator: the band covering the most area and the
    loudest band present.

    Area outside every contour counts as a band of its own ("below the lowest
    reported band"); when it is the largest, the dominant band is empty."""
    keys = [zone_id, "source", "indicator"]
    groups = by_band.groupby(keys)
    dominant = by_band.loc[groups.area_m2.idxmax(), keys + ["band_min_db", "area_share"]]
    dominant = dominant.merge(
        groups.area_share.sum().rename("covered_share").reset_index(), on=keys
    )
    quieter = dominant.area_share < 1 - dominant.covered_share
    dominant["dominant_band_min_db"] = dominant.band_min_db.astype("Int64").mask(quieter)
    loudest = groups.band_min_db.max().rename("max_band_min_db").reset_index()
    return dominant[keys + ["dominant_band_min_db"]].merge(loudest, on=keys)
