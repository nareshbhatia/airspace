import { MapboxThreeCustomLayer } from './MapboxThreeCustomLayer';

import type {
  ProjectionMode,
  ThreeSceneData,
  ThreeSceneVisibilityState,
} from './types';
import type { Map as MapboxMap } from 'mapbox-gl';

const DEFAULT_MAX_ORTHO_CONTENT_HEIGHT_M = 250;
const DEFAULT_ORTHOGRAPHIC_VERTICAL_SCALE = 0.7;

interface AttachMapboxPlusThreeLayerOptions {
  sceneData: ThreeSceneData;
  projectionMode: ProjectionMode;
  visibilityState: ThreeSceneVisibilityState;
  maxOrthoContentHeightM?: number;
  orthographicVerticalScale?: number;
}

export interface MapboxPlusThreeLayerController {
  setProjectionMode: (projectionMode: ProjectionMode) => void;
  setSceneData: (sceneData: ThreeSceneData) => void;
  setVisibilityState: (visibilityState: ThreeSceneVisibilityState) => void;
  detach: () => void;
}

/**
 * Facade for attaching/updating/removing this page's Three.js custom layer.
 */
export function attachMapboxPlusThreeLayer(
  map: MapboxMap,
  options: AttachMapboxPlusThreeLayerOptions,
): MapboxPlusThreeLayerController {
  const existingLayer = map.getLayer('mapbox-plus-threejs-layer');
  if (existingLayer) {
    map.removeLayer('mapbox-plus-threejs-layer');
  }

  const customLayer = new MapboxThreeCustomLayer({
    initialProjectionMode: options.projectionMode,
    initialSceneData: options.sceneData,
    initialVisibilityState: options.visibilityState,
    maxOrthoContentHeightM:
      options.maxOrthoContentHeightM ?? DEFAULT_MAX_ORTHO_CONTENT_HEIGHT_M,
    orthographicVerticalScale:
      options.orthographicVerticalScale ?? DEFAULT_ORTHOGRAPHIC_VERTICAL_SCALE,
  });
  map.addLayer(customLayer);

  return {
    setProjectionMode: (projectionMode: ProjectionMode) => {
      customLayer.setProjectionMode(projectionMode);
      map.triggerRepaint();
    },
    setSceneData: (sceneData: ThreeSceneData) => {
      customLayer.setSceneData(sceneData);
      map.triggerRepaint();
    },
    setVisibilityState: (visibilityState: ThreeSceneVisibilityState) => {
      customLayer.setVisibilityState(visibilityState);
      map.triggerRepaint();
    },
    detach: () => {
      try {
        if (map.getLayer(customLayer.id)) {
          map.removeLayer(customLayer.id);
        }
      } catch {
        // Map may already be destroyed (e.g. MapProvider remounted via key change).
      }
    },
  };
}
