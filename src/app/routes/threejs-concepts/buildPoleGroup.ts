import { MercatorCoordinate } from 'mapbox-gl';
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';

import {
  POLE_RADIUS_M,
  POLE_STATUS_COLORS,
} from '../../../lib/mapbox/types/Pole';
import { mercatorToLocalPosition } from '../../../lib/mapbox/utils/mercatorUtils';

import type { Pole } from '../../../lib/mapbox/types/Pole';

/**
 * Builds a group of pole meshes in local scene coordinates.
 */
export function buildPoleGroup(
  poles: Pole[],
  centerLngLat: [number, number],
): Group | undefined {
  if (poles.length === 0) return undefined;

  const originMerc = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMerc.meterInMercatorCoordinateUnits();
  const group = new Group();

  for (const pole of poles) {
    const local = mercatorToLocalPosition(
      [pole.lng, pole.lat],
      originMerc,
      originScale,
    );
    const baseM = pole.baseMetersAgl;
    const poleHeightM = pole.topMetersAgl - baseM;
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
    mesh.position.set(local.x, baseM + poleHeightM / 2, local.y);
    group.add(mesh);
  }

  return group;
}
