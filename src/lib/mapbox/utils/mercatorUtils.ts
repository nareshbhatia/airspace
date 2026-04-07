import { MercatorCoordinate } from 'mapbox-gl';
import { Matrix4, Vector3 } from 'three';

import type { Map as MapboxMap } from 'mapbox-gl';

/** Mean meridian arc meters per degree (WGS84), for a 1 m north–south offset. */
const METERS_PER_DEGREE_LAT = 111132.954;

/**
 * Converts a geographic position to a local Three.js XY offset (meters) relative
 * to a Mercator origin and scale.
 */
export function mercatorToLocalPosition(
  lngLat: [number, number],
  originMerc: MercatorCoordinate,
  originScale: number,
): { x: number; y: number } {
  const merc = MercatorCoordinate.fromLngLat(lngLat, 0);
  const offsetXm = (merc.x - originMerc.x) / originScale;
  const offsetYm = (originMerc.y - merc.y) / originScale;
  return { x: offsetXm, y: offsetYm };
}

/**
 * Model transform: translate to Mercator origin, scale meters -> Mercator units.
 * The negative Y scale maps Three.js Y-up into Mapbox Mercator Y-south space.
 */
export function computeModelTransform(originMerc: MercatorCoordinate): Matrix4 {
  const scale = originMerc.meterInMercatorCoordinateUnits();
  return new Matrix4()
    .makeTranslation(originMerc.x, originMerc.y, originMerc.z)
    .scale(new Vector3(scale, -scale, scale));
}

/**
 * Pixels per meter at the map center, using public APIs only (`getCenter`, `project`).
 * Projects a 1 m north–south offset and measures pixel length (matches current zoom/bearing).
 */
export function getPixelsPerMeter(map: MapboxMap): number {
  const center = map.getCenter();
  const lat = center.lat;
  if (Number.isNaN(lat)) {
    return 1;
  }
  const deltaLat = 1 / METERS_PER_DEGREE_LAT;
  const p0 = map.project([center.lng, center.lat]);
  const p1 = map.project([center.lng, center.lat + deltaLat]);
  const pixelsPerMeter = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (!Number.isFinite(pixelsPerMeter) || pixelsPerMeter <= 0) {
    return 1;
  }
  return pixelsPerMeter;
}
