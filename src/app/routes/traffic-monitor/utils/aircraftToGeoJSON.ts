import type { Aircraft } from '../types';

/**
 * Converts Aircraft[] to a GeoJSON FeatureCollection of Points for use with
 * Mapbox symbol layers. Each feature has icao24 (for feature-state) and
 * headingDeg (for icon-rotate).
 */
export function aircraftToFeatureCollection(
  aircraft: Aircraft[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = aircraft.map((a) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [a.longitude, a.latitude],
    },
    properties: {
      icao24: a.icao24,
      headingDeg: a.headingDeg,
    },
  }));
  return {
    type: 'FeatureCollection',
    features,
  };
}
