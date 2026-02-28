import type { LngLat } from '../../../../lib/mapbox';
import type { LngLatBoundsLike } from 'mapbox-gl';

/**
 * Bounding box as [west, south, east, north] for easy conversion to Mapbox
 * LngLatBoundsLike and GeoJSON polygon coordinates.
 */
export type BoundingBox = [
  west: number,
  south: number,
  east: number,
  north: number,
];

const MILES_PER_DEGREE_LAT = 69;

/**
 * Computes a lat/lng bounding box around a center point for a given radius in
 * miles. Uses ~69 miles per degree latitude and cosine correction for longitude.
 */
export function computeBoundingBox(
  center: LngLat,
  radiusMiles: number,
): BoundingBox {
  const lat = center.lat;
  const lng = center.lng;
  const latDelta = radiusMiles / MILES_PER_DEGREE_LAT;
  const lngDegreesPerMile =
    1 / (MILES_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));
  const lngDelta = radiusMiles * lngDegreesPerMile;

  return [lng - lngDelta, lat - latDelta, lng + lngDelta, lat + latDelta];
}

/**
 * Converts a BoundingBox to Mapbox LngLatBoundsLike for use with fitBounds.
 */
export function boundsToLngLatBoundsLike(box: BoundingBox): LngLatBoundsLike {
  const [west, south, east, north] = box;
  return [
    [west, south],
    [east, north],
  ];
}

/**
 * Converts a BoundingBox to a GeoJSON FeatureCollection containing a single
 * polygon (closed ring) for use with a Mapbox fill source.
 */
export function bboxToFeatureCollection(
  box: BoundingBox,
): GeoJSON.FeatureCollection {
  const [west, south, east, north] = box;
  const ring: GeoJSON.Position[] = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
    properties: {},
  };
  return {
    type: 'FeatureCollection',
    features: [feature],
  };
}
