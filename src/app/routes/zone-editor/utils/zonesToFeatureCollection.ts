import type { DrawnZone, ZoneType } from '../types';

/**
 * Converts committed zones to a GeoJSON FeatureCollection for the map layer.
 * Each feature has id and type in properties for data-driven styling and selection.
 */
export function zonesToFeatureCollection(
  zones: DrawnZone[],
): GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  { id: string; type: ZoneType | null }
> {
  const features: GeoJSON.Feature<
    GeoJSON.Polygon,
    { id: string; type: ZoneType | null }
  >[] = zones.map((zone) => ({
    type: 'Feature',
    geometry: zone.geometry,
    properties: {
      id: zone.id,
      type: zone.type,
    },
  }));
  return {
    type: 'FeatureCollection',
    features,
  };
}
