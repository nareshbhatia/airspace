import { MercatorCoordinate } from 'mapbox-gl';
import {
  AmbientLight,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from 'three';

import { mercatorToLocalPosition } from './mercatorUtils';
import { UTILITY_POLE_RADIUS_M } from '../../../lib/mapbox/types/UtilityPole';

import type { UtilityPole } from '../../../lib/mapbox/types/UtilityPole';

const statusColors: Record<string, number> = {
  nominal: 0x22c55e,
  flagged: 0xef4444,
  inspected: 0x9ca3af,
};

/**
 * Builds a Three.js scene with lit utility poles at geographic positions.
 * Returns undefined when there are no poles (nothing to anchor an origin).
 */
export function buildPolesScene(
  poles: UtilityPole[],
): { polesScene: Scene; originMerc: MercatorCoordinate } | undefined {
  const refPole = poles[0];
  if (!refPole) return undefined;

  const polesScene = new Scene();
  const polesGroup = new Group();

  // Add lights
  polesScene.add(new AmbientLight(0xffffff, 0.6));
  const sun = new DirectionalLight(0xffffff, 0.9);
  sun.position.set(50, 100, 50);
  polesScene.add(sun);

  // Calculate origin Mercator coordinate and scale
  const originMerc = MercatorCoordinate.fromLngLat(
    [refPole.lng, refPole.lat],
    0,
  );
  const originScale = originMerc.meterInMercatorCoordinateUnits();

  // Build each pole as a separate mesh and add it to the polesGroup
  for (const pole of poles) {
    const { x: offsetXm, y: offsetYm } = mercatorToLocalPosition(
      [pole.lng, pole.lat],
      originMerc,
      originScale,
    );
    const poleHeightM = pole.inspectionAltM;

    const material = new MeshStandardMaterial({
      color: statusColors[pole.status] ?? 0xffffff,
    });
    const poleGeometry = new CylinderGeometry(
      UTILITY_POLE_RADIUS_M,
      UTILITY_POLE_RADIUS_M,
      poleHeightM,
      12,
    );
    const mesh = new Mesh(poleGeometry, material);

    mesh.position.set(offsetXm, offsetYm, poleHeightM / 2);
    mesh.rotation.x = Math.PI / 2;
    mesh.frustumCulled = false;

    polesGroup.add(mesh);
  }

  // Add the polesGroup to the polesScene
  polesScene.add(polesGroup);

  return { polesScene, originMerc };
}
