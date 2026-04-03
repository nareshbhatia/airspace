import { useState } from 'react';

import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import {
  BearingDisplay,
  MapPanel,
  MapProvider,
  MapViewModeToggle,
  PitchDisplay,
  SceneSelector,
  TerrainSwitch,
  useMapViewMode,
  ZoomLevelDisplay,
} from '../../../lib/mapbox';
import {
  addZones,
  addPoles,
  addRoute,
} from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

import type { MapViewMode } from '../../../lib/mapbox';
import type { AirspaceScene } from '../../../lib/mapbox/types/AirspaceScene';

interface Mapbox3DConceptsPanelProps {
  isTerrainEnabled: boolean;
  onTerrainEnabledChange: (isTerrainEnabled: boolean) => void;
  mapViewMode: MapViewMode;
  onMapViewModeChange: (mode: MapViewMode) => void;
  scene: AirspaceScene;
  onSceneChange: (scene: AirspaceScene) => void;
}

function Mapbox3DConceptsPanel({
  isTerrainEnabled,
  onTerrainEnabledChange,
  mapViewMode,
  onMapViewModeChange,
  scene,
  onSceneChange,
}: Mapbox3DConceptsPanelProps) {
  useMapViewMode(mapViewMode);

  return (
    <MapPanel>
      <ZoomLevelDisplay />
      <PitchDisplay />
      <BearingDisplay />
      <TerrainSwitch
        isTerrainEnabled={isTerrainEnabled}
        onTerrainEnabledChange={onTerrainEnabledChange}
      />
      <MapViewModeToggle
        mode={mapViewMode}
        onModeChange={onMapViewModeChange}
      />
      <SceneSelector
        scenes={scenes}
        selectedScene={scene}
        onSceneChange={onSceneChange}
      />
    </MapPanel>
  );
}

/**
 * Minimal Mapbox page used for 3D concepts exploration.
 */
export function Mapbox3DConceptsPage() {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [isTerrainEnabled, setIsTerrainEnabled] = useState(true);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <div className="min-h-0 flex-1 w-full">
        <MapProvider
          key={scene.name} // ask react to remount MapProvider when the scene changes
          {...scene.mapProvider}
          style={MAPBOX_STANDARD_SATELLITE_STYLE}
          className="w-full h-full"
          mapOptions={{ antialias: true }}
          enableTerrain={isTerrainEnabled}
          onLoad={(map) => {
            addZones(map, scene.zones);
            addPoles(map, scene.poles);
            addRoute(map, scene.route);
          }}
        >
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 min-w-40">
            <Mapbox3DConceptsPanel
              isTerrainEnabled={isTerrainEnabled}
              onTerrainEnabledChange={setIsTerrainEnabled}
              mapViewMode={mapViewMode}
              onMapViewModeChange={setMapViewMode}
              scene={scene}
              onSceneChange={setScene}
            />
          </div>
        </MapProvider>
      </div>
    </div>
  );
}
