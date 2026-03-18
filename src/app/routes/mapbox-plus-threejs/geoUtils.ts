import { MercatorCoordinate } from 'mapbox-gl';
import { Vector3 } from 'three';

import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Converts a geographic position (longitude, latitude, altitude in meters) to
 * Three.js world coordinates in the same space used by the custom layer
 * camera: origin at map center, Y-up, X east, Z north.
 *
 * Mapbox uses Web Mercator; we use MercatorCoordinate.fromLngLat to get
 * normalized Mercator (x, y) and altitude in Mercator units (z), then scale
 * by world size (tileSize * 2^zoom) and offset from map center. The result
 * is then scaled to match the Step 4 camera's coordinate system (distance =
 * 100 * 2^(17-zoom)) so objects appear in the correct place in the view.
 */
export function lngLatAltToWorld(
  lng: number,
  lat: number,
  altMeters: number,
  map: MapboxMap,
): Vector3 {
  const center = map.getCenter();
  const zoom = map.getZoom();

  const point = MercatorCoordinate.fromLngLat([lng, lat], altMeters);
  const centerMercator = MercatorCoordinate.fromLngLat(
    [center.lng, center.lat],
    0,
  );

  const worldSize = 512 * Math.pow(2, zoom);
  // Match Step 4 camera scale: camera distance = 100 * 2^(17-zoom).
  const cameraScale = (100 * Math.pow(2, 17 - zoom)) / worldSize;

  return new Vector3(
    (point.x - centerMercator.x) * worldSize * cameraScale,
    point.z * worldSize * cameraScale,
    (point.y - centerMercator.y) * worldSize * cameraScale,
  );
}
