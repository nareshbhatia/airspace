import { MercatorCoordinate } from 'mapbox-gl';
import {
  CatmullRomCurve3,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';

import { mercatorToLocalPosition } from '../../../lib/mapbox/utils/mercatorUtils';

import type { Waypoint } from '../../../lib/mapbox/types/Waypoint';

/**
 * Route geometry in the Mapbox custom layer.
 *
 * Known limitation — uneven / steep terrain:
 * Routes can still render incorrectly (invisible, clipped, or fighting the
 * terrain mesh) in highly irregular terrain. Example: the Fort Collins scene
 * remains a problem case while flatter scenes improve with denser sampling.
 * Contributing factors: DEM resolution vs. path, `CatmullRomCurve3` smoothing
 * between dense samples can still pass slightly under local terrain, depth
 * precision with large terrain-relative Z, and the fixed `0m AGL` lift being
 * too small on steep slopes. A fuller fix would be terrain-conforming path
 * generation (finer steps, polyline-only extrusion without spline undershoot,
 * or higher clearance) and/or tuning per scene.
 */

const ROUTE_TUBE_RADIUS_METERS = 1.0;
const ROUTE_ZERO_AGL_LIFT_METERS = 0.75;

/** Horizontal spacing between terrain samples along each leg (meters). */
const ROUTE_SEGMENT_SAMPLE_STEP_METERS = 6;

function horizontalDistanceMeters(
  aLngLat: [number, number],
  bLngLat: [number, number],
  originMercator: MercatorCoordinate,
  originScale: number,
): number {
  const pa = mercatorToLocalPosition(aLngLat, originMercator, originScale);
  const pb = mercatorToLocalPosition(bLngLat, originMercator, originScale);
  return Math.hypot(pb.x - pa.x, pb.y - pa.y);
}

function altitudeMetersForRoute(altitudeMetersAgl: number): number {
  return altitudeMetersAgl > 0 ? altitudeMetersAgl : ROUTE_ZERO_AGL_LIFT_METERS;
}

/**
 * Dense samples along each straight leg in lng/lat, with terrain + AGL at every
 * sample. This reduces cases where a spline through sparse waypoints dives
 * under the terrain, but it does not fully fix uneven terrain (see file
 * comment above): the subsequent `CatmullRomCurve3` can still undershoot
 * between samples, and DEM vs. mesh mismatch remains.
 */
function buildDenseRoutePoints(
  sortedRoute: Waypoint[],
  originMercator: MercatorCoordinate,
  originScale: number,
  getTerrainElevationMeters: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters: number,
): Vector3[] {
  const points: Vector3[] = [];

  const pushSample = (lng: number, lat: number, altitudeMetersAgl: number) => {
    const local = mercatorToLocalPosition(
      [lng, lat],
      originMercator,
      originScale,
    );
    const terrainElevationMeters = getTerrainElevationMeters([lng, lat]);
    const terrainDeltaMeters =
      terrainElevationMeters - centerTerrainElevationMeters;
    const routeAltitudeMeters = altitudeMetersForRoute(altitudeMetersAgl);
    points.push(
      new Vector3(local.x, local.y, terrainDeltaMeters + routeAltitudeMeters),
    );
  };

  for (let legIndex = 0; legIndex < sortedRoute.length - 1; legIndex += 1) {
    const a = sortedRoute[legIndex];
    const b = sortedRoute[legIndex + 1];
    const distM = horizontalDistanceMeters(
      [a.lng, a.lat],
      [b.lng, b.lat],
      originMercator,
      originScale,
    );
    const segmentCount = Math.max(
      1,
      Math.ceil(distM / ROUTE_SEGMENT_SAMPLE_STEP_METERS),
    );

    for (let j = 0; j <= segmentCount; j += 1) {
      if (legIndex > 0 && j === 0) {
        continue;
      }
      const t = j / segmentCount;
      const lng = a.lng + (b.lng - a.lng) * t;
      const lat = a.lat + (b.lat - a.lat) * t;
      const altitudeMetersAgl =
        a.altitudeMetersAgl + (b.altitudeMetersAgl - a.altitudeMetersAgl) * t;
      pushSample(lng, lat, altitudeMetersAgl);
    }
  }

  return points;
}

/**
 * Builds the route line directly in the Mapbox custom-layer local coordinate system:
 * - `x` = east-west meters
 * - `y` = north-south meters
 * - `z` = altitude meters
 *
 * We render the route as a thin tube instead of a raw `THREE.Line` because a
 * 1px line can be hard to see at this zoom and segments at `0m AGL` tend to
 * coincide exactly with terrain, making them disappear due to z-fighting.
 *
 * In hilly areas, a smooth curve through only the waypoints can pass under the
 * terrain between samples; we densify along each leg and sample terrain at each
 * sample so the path follows the ground plus AGL. Steep, irregular terrain can
 * still misbehave; see the file-level note.
 */
export function buildMapboxRouteLine(
  route: Waypoint[],
  centerLngLat: [number, number],
  getTerrainElevationMeters?: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters = 0,
): Mesh | undefined {
  if (route.length < 2) return undefined;

  const sortedRoute = [...route].sort((a, b) => a.sequence - b.sequence);
  const originMercator = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMercator.meterInMercatorCoordinateUnits();

  const terrainSampler = getTerrainElevationMeters ?? (() => 0);

  const points = buildDenseRoutePoints(
    sortedRoute,
    originMercator,
    originScale,
    terrainSampler,
    centerTerrainElevationMeters,
  );

  if (points.length < 2) return undefined;

  const routeCurve = new CatmullRomCurve3(points, false);
  const tubularSegments = Math.min(Math.max(points.length * 4, 48), 384);
  const geometry = new TubeGeometry(
    routeCurve,
    tubularSegments,
    ROUTE_TUBE_RADIUS_METERS,
    8,
    false,
  );
  const material = new MeshBasicMaterial({ color: 0x38bdf8 });
  const routeMesh = new Mesh(geometry, material);
  routeMesh.name = 'route-line';
  return routeMesh;
}
