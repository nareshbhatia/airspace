import { MercatorCoordinate } from 'mapbox-gl';
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';

import {
  POLE_RADIUS_M,
  POLE_STATUS_COLORS,
} from '../../../lib/mapbox/types/Pole';
import { mercatorToLocalPosition } from '../../../lib/mapbox/utils/mercatorUtils';

import type { Pole } from '../../../lib/mapbox/types/Pole';

/**
 * Builds pole geometry directly in the Mapbox custom-layer local coordinate system:
 * - `x` = east-west meters
 * - `y` = north-south meters
 * - `z` = altitude meters
 */
export function buildMapboxPoleGroup(
  poles: Pole[],
  centerLngLat: [number, number],
  getTerrainElevationMeters?: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters = 0,
): Group | undefined {
  if (poles.length === 0) return undefined;

  const originMercator = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMercator.meterInMercatorCoordinateUnits();
  const group = new Group();

  for (const pole of poles) {
    const local = mercatorToLocalPosition(
      [pole.lng, pole.lat],
      originMercator,
      originScale,
    );
    const terrainElevationMeters =
      getTerrainElevationMeters?.([pole.lng, pole.lat]) ?? 0;
    const terrainDeltaMeters =
      terrainElevationMeters - centerTerrainElevationMeters;

    const poleBaseMetersAgl = pole.baseMetersAgl;
    const poleHeightMeters = pole.topMetersAgl - poleBaseMetersAgl;
    if (poleHeightMeters <= 0) continue;

    const geometry = new CylinderGeometry(
      POLE_RADIUS_M,
      POLE_RADIUS_M,
      poleHeightMeters,
      12,
    );
    geometry.rotateX(Math.PI / 2);

    const material = new MeshStandardMaterial({
      color: POLE_STATUS_COLORS[pole.status],
      metalness: 0.1,
      roughness: 0.8,
    });

    const mesh = new Mesh(geometry, material);
    mesh.position.set(
      local.x,
      local.y,
      terrainDeltaMeters + poleBaseMetersAgl + poleHeightMeters / 2,
    );
    group.add(mesh);
  }

  return group;
}
