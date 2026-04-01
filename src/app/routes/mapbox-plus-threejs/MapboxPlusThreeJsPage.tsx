import { useCallback, useRef, useState } from 'react';

import { addThreeJsCustomLayer } from './addThreeJsCustomLayer';
import { Button } from '../../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { scene } from '../../../data/scene3d-nebraska';
import { MapPanel } from '../../../lib/mapbox/controls/MapPanel';
import { ZoomLevelDisplay } from '../../../lib/mapbox/controls/ZoomLevelDisplay';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import { addBuildings } from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

import type {
  CameraSyncStrategy,
  ProjectionMode,
  ThreeJsMapCustomLayer,
} from './threeJsMapLayerTypes';
import type { Map as MapboxMap } from 'mapbox-gl';

const MAX_ORTHO_CONTENT_HEIGHT_M = 20;

const STRATEGY_TOGGLE_TOOLTIP: Record<CameraSyncStrategy, string> = {
  'mapbox-matrix':
    'Click to switch to camera-sync mode: same Mapbox matrix × modelTransform projection as MX, plus experimental setNearClipOffset in 2D (orthographic) to reduce clipping of tall content.',
  'camera-sync':
    'Click to switch to mapbox-matrix mode: Mapbox matrix × modelTransform only; no setNearClipOffset.',
};

/**
 * Mapbox + Three.js page: pitched satellite map with Mapbox 3D buildings
 * (fill-extrusion). Step 1 establishes the base map; later steps add a
 * custom layer and Three.js content.
 */
export function MapboxPlusThreeJsPage() {
  const [projectionMode, setProjectionMode] =
    useState<ProjectionMode>('perspective');
  const [syncStrategy, setSyncStrategy] =
    useState<CameraSyncStrategy>('mapbox-matrix');
  const mapRef = useRef<MapboxMap | undefined>(undefined);
  const layerRef = useRef<ThreeJsMapCustomLayer | undefined>(undefined);

  const applyProjectionMode = useCallback(
    (map: MapboxMap, mode: ProjectionMode) => {
      layerRef.current?.setProjectionMode(mode);
      map.setCamera({ 'camera-projection': mode });
      if (mode === 'orthographic') {
        map.easeTo({ pitch: 0, duration: 300 });
      } else {
        map.easeTo({ pitch: scene.mapProvider.pitch, duration: 300 });
      }
    },
    [],
  );

  const handleProjectionToggle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextMode: ProjectionMode =
      projectionMode === 'perspective' ? 'orthographic' : 'perspective';
    setProjectionMode(nextMode);
    applyProjectionMode(map, nextMode);
  }, [applyProjectionMode, projectionMode]);

  const replaceThreeLayer = useCallback(
    (
      map: MapboxMap,
      strategy: CameraSyncStrategy,
      mode: ProjectionMode,
    ): ThreeJsMapCustomLayer | undefined => {
      if (map.getLayer('threejs-layer')) {
        map.removeLayer('threejs-layer');
      }
      const layer = addThreeJsCustomLayer(map, {
        strategy,
        projectionMode: mode,
        maxOrthoContentHeightM: MAX_ORTHO_CONTENT_HEIGHT_M,
      });
      return layer;
    },
    [],
  );

  const handleMapLoad = useCallback(
    (map: MapboxMap) => {
      mapRef.current = map;
      addBuildings(map);
      layerRef.current = replaceThreeLayer(map, syncStrategy, projectionMode);
      applyProjectionMode(map, projectionMode);
    },
    [applyProjectionMode, projectionMode, replaceThreeLayer, syncStrategy],
  );

  const handleStrategyToggle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextStrategy: CameraSyncStrategy =
      syncStrategy === 'mapbox-matrix' ? 'camera-sync' : 'mapbox-matrix';
    setSyncStrategy(nextStrategy);
    layerRef.current = replaceThreeLayer(map, nextStrategy, projectionMode);
    applyProjectionMode(map, projectionMode);
  }, [applyProjectionMode, projectionMode, replaceThreeLayer, syncStrategy]);

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <div className="min-h-0 flex-1 w-full">
        <MapProvider
          {...scene.mapProvider}
          style={MAPBOX_STANDARD_SATELLITE_STYLE}
          className="w-full h-full"
          mapOptions={{ antialias: true }}
          onLoad={handleMapLoad}
        >
          <MapPanel className="absolute right-3 top-3 z-10">
            <ZoomLevelDisplay />
            <Button
              variant="outline"
              size="icon-lg"
              onClick={handleProjectionToggle}
              aria-label={
                projectionMode === 'perspective'
                  ? 'Switch to 2D'
                  : 'Switch to 3D'
              }
              className="text-xs font-semibold"
            >
              {projectionMode === 'perspective' ? '2D' : '3D'}
            </Button>
            <Tooltip>
              <TooltipTrigger
                delay={400}
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    onClick={handleStrategyToggle}
                    aria-label={STRATEGY_TOGGLE_TOOLTIP[syncStrategy]}
                    className="px-2 text-xs font-semibold"
                  >
                    {syncStrategy === 'mapbox-matrix' ? 'CS' : 'MX'}
                  </Button>
                }
              />
              <TooltipContent side="bottom" align="end" className="max-w-xs">
                {STRATEGY_TOGGLE_TOOLTIP[syncStrategy]}
              </TooltipContent>
            </Tooltip>
          </MapPanel>
        </MapProvider>
      </div>
    </div>
  );
}
