import { MercatorCoordinate } from 'mapbox-gl';
import { Matrix4, Vector3 } from 'three';

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
 * Model transform: translate to Mercator origin, scale meters → Mercator units.
 * The negative Y scale maps Three.js Y-up into Mapbox Mercator Y-south space.
 */
export function computeModelTransform(originMerc: MercatorCoordinate): Matrix4 {
  const scale = originMerc.meterInMercatorCoordinateUnits();
  return new Matrix4()
    .makeTranslation(originMerc.x, originMerc.y, originMerc.z)
    .scale(new Vector3(scale, -scale, scale));
}
