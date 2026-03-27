import { buildPoleScene } from './buildPoleScene';
import { ThreeJsCustomLayer } from './ThreeJsCustomLayer';
import { utilityPoles } from '../../../data/scene3d-rural';

import type {
  CameraSyncStrategy,
  ProjectionMode,
} from './ThreeJsCustomLayer';
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
): ThreeJsCustomLayer | undefined {
  // Check if the layer is already added
  if (map.getLayer('threejs-layer')) return undefined;

  // Build the scene
  const built = buildPoleScene(utilityPoles);
  if (!built) return undefined;

  // Create the layer
  const { scene, originMerc } = built;
  const layer = new ThreeJsCustomLayer(scene, originMerc, options);
  map.addLayer(layer);
  return layer;
}
