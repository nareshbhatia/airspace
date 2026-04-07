import { useEffect, useRef, useState } from 'react';

import { MapboxPlusThreeJsOverlay } from './MapboxPlusThreeJsOverlay';
import { attachMapboxPlusThreeLayer } from './mapboxPlusThreeLayer';
import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import { MapProvider } from '../../../lib/mapbox';
import { cn } from '../../../utils/cn';

import type { MapboxPlusThreeLayerController } from './mapboxPlusThreeLayer';
import type { ProjectionMode, ThreeSceneVisibilityState } from './types';
import type { MapViewMode } from '../../../lib/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';

const THREE_LAYER_ID = 'mapbox-plus-threejs-layer';

const DEFAULT_VISIBILITY_STATE: ThreeSceneVisibilityState = {
  zones: true,
  poles: true,
  route: true,
};

function toProjectionMode(mapViewMode: MapViewMode): ProjectionMode {
  return mapViewMode === '3d' ? 'perspective' : 'orthographic';
}

/**
 * Mapbox + Three.js page.
 *
 * Lifecycle overview:
 *   1. MapProvider creates the Mapbox map and fires onLoad once.
 *      MapProvider wraps onLoad with useEffectEvent, so the callback
 *      always sees the latest component state — no stale closures.
 *   2. handleMapLoad attaches the Three.js custom layer to the map.
 *   3. Scene changes cause MapProvider to remount (via key={scene.name}),
 *      which creates a fresh map and fires handleMapLoad again.
 *      No separate scene effect is needed.
 *   4. Projection and visibility changes are pushed to the existing
 *      layer controller via lightweight useEffects.
 */
export function MapboxPlusThreeJsPage() {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');
  const [isTerrainEnabled, setIsTerrainEnabled] = useState(true);
  const [visibilityState, setVisibilityState] =
    useState<ThreeSceneVisibilityState>(DEFAULT_VISIBILITY_STATE);

  const layerControllerRef = useRef<MapboxPlusThreeLayerController | undefined>(
    undefined,
  );
  const mapRef = useRef<MapboxMap | undefined>(undefined);
  const styleLoadHandlerRef = useRef<(() => void) | undefined>(undefined);
  const idleHandlerRef = useRef<(() => void) | undefined>(undefined);

  const projectionMode = toProjectionMode(mapViewMode);

  const latestSceneRef = useRef(scene);
  const latestProjectionModeRef = useRef(projectionMode);
  const latestVisibilityStateRef = useRef(visibilityState);

  useEffect(() => {
    latestSceneRef.current = scene;
    latestProjectionModeRef.current = projectionMode;
    latestVisibilityStateRef.current = visibilityState;
  }, [scene, projectionMode, visibilityState]);

  /**
   * Ensures the custom layer exists for the current map style. If missing (for
   * example after style/terrain reconciliation), reattach exactly once.
   */
  const ensureThreeLayerAttached = (map: MapboxMap): void => {
    if (!map.isStyleLoaded()) return;

    let layerExistsInStyle = false;
    try {
      layerExistsInStyle = map.getLayer(THREE_LAYER_ID) != null;
    } catch {
      // Mapbox can transiently throw while style internals reconcile.
      return;
    }

    if (!layerControllerRef.current || !layerExistsInStyle) {
      layerControllerRef.current?.detach();
      layerControllerRef.current = attachMapboxPlusThreeLayer(map, {
        sceneData: { scene: latestSceneRef.current },
        projectionMode: latestProjectionModeRef.current,
        visibilityState: latestVisibilityStateRef.current,
      });
    }
  };

  /**
   * ---------- Map load ----------
   * Attach the Three.js custom layer. MapProvider's useEffectEvent ensures
   * this closure always has the latest state values (scene, projectionMode,
   * visibilityState) even though it's defined as a plain function.
   *
   * This also runs on scene change because key={scene.name} remounts
   * MapProvider, creating a fresh map that fires onLoad again.
   */
  const handleMapLoad = (map: MapboxMap) => {
    const previousMap = mapRef.current;
    const previousStyleLoadHandler = styleLoadHandlerRef.current;
    const previousIdleHandler = idleHandlerRef.current;

    if (previousMap && previousStyleLoadHandler) {
      previousMap.off('style.load', previousStyleLoadHandler);
    }
    if (previousMap && previousIdleHandler) {
      previousMap.off('idle', previousIdleHandler);
    }

    mapRef.current = map;
    ensureThreeLayerAttached(map);

    const handleStyleLoad = () => {
      ensureThreeLayerAttached(map);
    };
    const handleIdle = () => {
      ensureThreeLayerAttached(map);
    };
    styleLoadHandlerRef.current = handleStyleLoad;
    idleHandlerRef.current = handleIdle;
    map.on('style.load', handleStyleLoad);
    map.on('idle', handleIdle);
  };

  /**
   * ---------- Projection mode sync ----------
   * Push 2D/3D changes to the existing layer without recreating it.
   */
  useEffect(() => {
    layerControllerRef.current?.setProjectionMode(projectionMode);
  }, [projectionMode]);

  /**
   * ---------- Visibility sync ----------
   * Push layer toggle changes to the existing layer.
   */
  useEffect(() => {
    layerControllerRef.current?.setVisibilityState(visibilityState);
  }, [visibilityState]);

  /**
   * ---------- Scene / terrain sync ----------
   * Rebuild content when the selected scene changes or when terrain toggles,
   * because AGL geometry is baked against sampled terrain.
   */
  useEffect(() => {
    layerControllerRef.current?.setSceneData({ scene });
    const map = mapRef.current;
    if (!map) return;

    const refreshSceneAfterIdle = () => {
      layerControllerRef.current?.setSceneData({ scene });
    };
    map.once('idle', refreshSceneAfterIdle);

    return () => {
      map.off('idle', refreshSceneAfterIdle);
    };
  }, [isTerrainEnabled, scene]);

  /**
   * ---------- Cleanup ----------
   * Remove listeners and detach the custom layer when page unmounts.
   */
  useEffect(() => {
    return () => {
      const map = mapRef.current;
      const styleLoadHandler = styleLoadHandlerRef.current;
      const idleHandler = idleHandlerRef.current;
      if (map && styleLoadHandler) {
        map.off('style.load', styleLoadHandler);
      }
      if (map && idleHandler) {
        map.off('idle', idleHandler);
      }
      layerControllerRef.current?.detach();
      layerControllerRef.current = undefined;
      mapRef.current = undefined;
      styleLoadHandlerRef.current = undefined;
      idleHandlerRef.current = undefined;
    };
  }, []);

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <div className="min-h-0 flex-1 w-full">
        <MapProvider
          key={scene.name}
          {...scene.mapProvider}
          style={MAPBOX_STANDARD_SATELLITE_STYLE}
          className="w-full h-full"
          mapOptions={{ antialias: true }}
          enableTerrain={isTerrainEnabled}
          onLoad={handleMapLoad}
        >
          <MapboxPlusThreeJsOverlay
            mapViewMode={mapViewMode}
            onMapViewModeChange={setMapViewMode}
            scene={scene}
            scenes={scenes}
            onSceneChange={setScene}
            isTerrainEnabled={isTerrainEnabled}
            onTerrainEnabledChange={setIsTerrainEnabled}
            visibilityState={visibilityState}
            onVisibilityStateChange={setVisibilityState}
          />
        </MapProvider>
      </div>
    </div>
  );
}
