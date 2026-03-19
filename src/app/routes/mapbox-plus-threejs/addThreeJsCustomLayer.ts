import { ThreeJsCustomLayer } from './ThreeJsCustomLayer';

import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Adds the Three.js Mapbox custom layer (if not already present).
 * This keeps the page component symmetrical with other layer helpers
 * like `addBuildings(map)`.
 */
export function addThreeJsCustomLayer(map: MapboxMap): void {
  const layer = new ThreeJsCustomLayer();
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer);
}
