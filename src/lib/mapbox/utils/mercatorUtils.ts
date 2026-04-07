import { MercatorCoordinate } from 'mapbox-gl';
import { Matrix4, Vector3 } from 'three';

import type { Map as MapboxMap } from 'mapbox-gl';

const EARTH_CIRCUMFERENCE_M = 40075016.68557849;

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
 * Pixels per meter at the map center latitude (for experimental near-clip offset).
 */
export function getPixelsPerMeter(map: MapboxMap): number {
  const mapTransform = map.transform;
  const tileSize = mapTransform.tileSize;
  const scale = mapTransform.scale;
  const lat = mapTransform.center.lat;
  if (Number.isNaN(lat)) {
    return 1;
  }
  const worldSize = tileSize * scale;
  const metersPerMercatorUnitAtLat =
    EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180);
  const mercatorUnitsPerMeter = 1 / metersPerMercatorUnitAtLat;
  return mercatorUnitsPerMeter * worldSize;
}
