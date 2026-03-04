import type { DroneState } from '../../../../stores/droneStore';

/**
 * Converts drone state to a GeoJSON FeatureCollection of Points for use with
 * Mapbox symbol layers. Each feature has droneId (for selection/feature-state)
 * and heading (for icon-rotate).
 */
export function dronesToFeatureCollection(
  drones: DroneState[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = drones.map((d) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [d.lng, d.lat],
    },
    properties: {
      droneId: d.droneId,
      heading: d.heading,
    },
  }));
  return {
    type: 'FeatureCollection',
    features,
  };
}
