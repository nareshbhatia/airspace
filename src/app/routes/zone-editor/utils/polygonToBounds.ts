import type { LngLatBoundsLike } from 'mapbox-gl';

/**
 * Returns the bounding box of a polygon's first ring as [[west, south], [east, north]].
 */
export function polygonToBounds(geometry: GeoJSON.Polygon): LngLatBoundsLike {
  const ring = geometry.coordinates[0];
  if (!ring || ring.length === 0) {
    return [
      [0, 0],
      [0, 0],
    ];
  }
  let minLng = ring[0][0];
  let maxLng = ring[0][0];
  let minLat = ring[0][1];
  let maxLat = ring[0][1];
  for (let i = 1; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
