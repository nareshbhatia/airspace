import { MercatorCoordinate } from 'mapbox-gl';
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';

import { lngLatToLocalPosition } from '../../../lib/mapbox';
import {
  POLE_RADIUS_M,
  POLE_STATUS_COLORS,
} from '../../../lib/mapbox/types/Pole';

import type { Pole } from '../../../lib/mapbox/types/Pole';

/**
 * Builds a group of pole meshes in local scene coordinates.
 */
export function buildPoleGroup(
  poles: Pole[],
  centerLngLat: [number, number],
  getTerrainElevationMeters?: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters = 0,
): Group | undefined {
  if (poles.length === 0) return undefined;

  const originMerc = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMerc.meterInMercatorCoordinateUnits();
  const group = new Group();

  for (const pole of poles) {
    const local = lngLatToLocalPosition(
      [pole.lng, pole.lat],
      originMerc,
      originScale,
    );
    const baseM = pole.baseMetersAgl;
    const poleHeightM = pole.topMetersAgl - baseM;
    const terrainElevationMeters =
      getTerrainElevationMeters?.([pole.lng, pole.lat]) ?? 0;
    const terrainDeltaMeters =
      terrainElevationMeters - centerTerrainElevationMeters;
    if (poleHeightM <= 0) continue;

    const geometry = new CylinderGeometry(
      POLE_RADIUS_M,
      POLE_RADIUS_M,
      poleHeightM,
      12,
    );
    const material = new MeshStandardMaterial({
      color: POLE_STATUS_COLORS[pole.status],
      metalness: 0.1,
      roughness: 0.8,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(
      local.x,
      terrainDeltaMeters + baseM + poleHeightM / 2,
      local.y,
    );
    group.add(mesh);
  }

  return group;
}
