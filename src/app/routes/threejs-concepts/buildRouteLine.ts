import { MercatorCoordinate } from 'mapbox-gl';
import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from 'three';

import { mercatorToLocalPosition } from '../mapbox-plus-threejs/mercatorUtils';

import type { Waypoint } from '../../../lib/mapbox/types/Waypoint';

/**
 * Builds a polyline through route waypoints in local scene coordinates.
 */
export function buildRouteLine(
  route: Waypoint[],
  centerLngLat: [number, number],
): Line<BufferGeometry, LineBasicMaterial> | undefined {
  if (route.length < 2) return undefined;

  const sortedRoute = [...route].sort((a, b) => a.sequence - b.sequence);
  const originMerc = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMerc.meterInMercatorCoordinateUnits();

  const points = sortedRoute.map((wp) => {
    const local = mercatorToLocalPosition(
      [wp.lng, wp.lat],
      originMerc,
      originScale,
    );
    // Intentional Z flip:
    // - Zones/poles use z = local.y and are already aligned in this scene.
    // - Route appeared mirrored north/south with that same mapping for current data.
    // - Keep route at z = -local.y so it renders in the expected southwest area.
    return new Vector3(local.x, wp.altM, -local.y);
  });

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({ color: 0x38bdf8 });
  const line = new Line(geometry, material);
  line.name = 'route-line';
  return line;
}
