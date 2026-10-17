import geopandas as gpd
import pandas as pd


def noise_at(points: gpd.GeoDataFrame, contours: gpd.GeoDataFrame) -> pd.DataFrame:
    """Noise band at each point, one row per point × source × indicator.

    A point outside every contour of a source × indicator gets an empty band,
    meaning it is below the lowest reported band (e.g. Lden < 55 dB)."""
    points = points.to_crs(contours.crs).reset_index(drop=True)
    rows = []
    for (source, indicator), layer in contours.groupby(["source", "indicator"]):
        hits = gpd.sjoin(
            points,
            layer[["band_min_db", "band_max_db", "geometry"]],
            how="left",
            predicate="intersects",
        )
        # A point on the edge between two bands touches both; keep the louder.
        hits = hits.sort_values("band_min_db", ascending=False)
        hits = hits[~hits.index.duplicated()].sort_index()
        rows.append(hits.assign(source=source, indicator=indicator))
    result = pd.concat(rows, ignore_index=True)
    return pd.DataFrame(result.drop(columns=["geometry", "index_right"]))
