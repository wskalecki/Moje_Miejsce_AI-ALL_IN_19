/**
 * URLs of the per-area OSM 3D layers built by data/scripts/osm3d (public/data/3d/<msiId>/).
 * Only the featured MSI areas have them.
 */
export const OSM3D_AREAS = ['powisle', 'blonia-wilanowskie', 'saska-kepa'] as const
export type Osm3dAreaId = (typeof OSM3D_AREAS)[number]

export type Osm3dLayerFile =
  | 'buildings.geojson'
  | 'roads.geojson'
  | 'roads-lines.geojson'
  | 'green.geojson'
  | 'water.geojson'
  | 'traffic.json'

export function hasOsm3d(msiId: string): msiId is Osm3dAreaId {
  return (OSM3D_AREAS as readonly string[]).includes(msiId)
}

export function osm3dUrl(msiId: Osm3dAreaId, file: Osm3dLayerFile, base = import.meta.env?.BASE_URL ?? '/'): string {
  return `${base.replace(/\/?$/, '/')}data/3d/${msiId}/${file}`
}
