import { buildPolesScene } from './buildPolesScene';
import { ThreeJsCameraSyncCustomLayer } from './ThreeJsCameraSyncCustomLayer';
import { ThreeJsCustomLayer } from './ThreeJsCustomLayer';
import { scene } from '../../../data/scene3d-valentine-ne';

import type {
  CameraSyncStrategy,
  ProjectionMode,
  ThreeJsMapCustomLayer,
} from './threeJsMapLayerTypes';
import type { Map as MapboxMap } from 'mapbox-gl';

interface AddThreeJsCustomLayerOptions {
  strategy?: CameraSyncStrategy;
  projectionMode?: ProjectionMode;
  maxOrthoContentHeightM?: number;
}

/**
 * Adds the Three.js Mapbox custom layer (if not already present).
 * This keeps the page component symmetrical with other layer helpers
 * like `addBuildings(map)`.
 */
export function addThreeJsCustomLayer(
  map: MapboxMap,
  options?: AddThreeJsCustomLayerOptions,
): ThreeJsMapCustomLayer | undefined {
  if (map.getLayer('threejs-layer')) return undefined;

  const built = buildPolesScene(scene.poles);
  if (!built) return undefined;

  const { polesScene, originMerc } = built;
  const strategy = options?.strategy ?? 'mapbox-matrix';

  if (strategy === 'camera-sync') {
    const layer = new ThreeJsCameraSyncCustomLayer(polesScene, originMerc, {
      projectionMode: options?.projectionMode,
      maxOrthoContentHeightM: options?.maxOrthoContentHeightM,
    });
    map.addLayer(layer);
    return layer;
  }

  const layer = new ThreeJsCustomLayer(polesScene, originMerc);
  map.addLayer(layer);
  return layer;
}
