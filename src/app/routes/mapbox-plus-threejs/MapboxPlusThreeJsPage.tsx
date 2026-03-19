import { useCallback, useRef, useState } from 'react';

import { addThreeJsCustomLayer } from './addThreeJsCustomLayer';
import { Button } from '../../../components/ui/button';
import { MAP_CENTER, MAP_VIEW } from '../../../data/scene3d';
import { MapPanel } from '../../../lib/mapbox/controls/MapPanel';
import { ZoomLevelDisplay } from '../../../lib/mapbox/controls/ZoomLevelDisplay';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import { addBuildings } from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

import type { ProjectionMode, ThreeJsCustomLayer } from './ThreeJsCustomLayer';
import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Mapbox + Three.js page: pitched satellite map with Mapbox 3D buildings
 * (fill-extrusion). Step 1 establishes the base map; later steps add a
 * custom layer and Three.js content.
 */
export function MapboxPlusThreeJsPage() {
  const [projectionMode, setProjectionMode] =
    useState<ProjectionMode>('perspective');
  const mapRef = useRef<MapboxMap | undefined>(undefined);
  const layerRef = useRef<ThreeJsCustomLayer | undefined>(undefined);

  const applyProjectionMode = useCallback(
    (map: MapboxMap, mode: ProjectionMode) => {
      map.setCamera({ 'camera-projection': mode });
      if (mode === 'orthographic') {
        map.easeTo({ pitch: 0, duration: 300 });
      } else {
        map.easeTo({ pitch: MAP_VIEW.pitch, duration: 300 });
      }
      layerRef.current?.setProjectionMode(mode);
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

  const handleMapLoad = useCallback(
    (map: MapboxMap) => {
      mapRef.current = map;
      addBuildings(map);
      layerRef.current = addThreeJsCustomLayer(map);
      if (layerRef.current) {
        layerRef.current.setProjectionMode(projectionMode);
      }
      applyProjectionMode(map, projectionMode);
    },
    [applyProjectionMode, projectionMode],
  );

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <div className="min-h-0 flex-1 w-full">
        <MapProvider
          style="mapbox://styles/mapbox/satellite-streets-v12"
          center={MAP_CENTER}
          zoom={MAP_VIEW.zoom}
          pitch={MAP_VIEW.pitch}
          bearing={MAP_VIEW.bearing}
          mapOptions={{ antialias: true }}
          onLoad={handleMapLoad}
          className="w-full h-full"
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
          </MapPanel>
        </MapProvider>
      </div>
    </div>
  );
}
