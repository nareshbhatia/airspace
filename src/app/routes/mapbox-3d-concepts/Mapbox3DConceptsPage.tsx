import { useState } from 'react';

import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import {
  BearingDisplay,
  MapPanel,
  MapProvider,
  PitchDisplay,
  PitchToggle,
  SceneSelector,
  TerrainSwitch,
  useMapPitch3dToggle,
  ZoomLevelDisplay,
} from '../../../lib/mapbox';
import { cn } from '../../../utils/cn';

import type { AirspaceScene } from '../../../lib/mapbox/types/AirspaceScene';

interface Mapbox3DConceptsPanelProps {
  isTerrainEnabled: boolean;
  onTerrainEnabledChange: (isTerrainEnabled: boolean) => void;
  is3dEnabled: boolean;
  on3dEnabledChange: (is3dEnabled: boolean) => void;
  scene: AirspaceScene;
  onSceneChange: (scene: AirspaceScene) => void;
}

function Mapbox3DConceptsPanel({
  isTerrainEnabled,
  onTerrainEnabledChange,
  is3dEnabled,
  on3dEnabledChange,
  scene,
  onSceneChange,
}: Mapbox3DConceptsPanelProps) {
  useMapPitch3dToggle(is3dEnabled);

  return (
    <MapPanel className="absolute right-3 top-3 z-10">
      <ZoomLevelDisplay />
      <PitchDisplay />
      <BearingDisplay />
      <TerrainSwitch
        isTerrainEnabled={isTerrainEnabled}
        onTerrainEnabledChange={onTerrainEnabledChange}
      />
      <PitchToggle
        is3dEnabled={is3dEnabled}
        on3dEnabledChange={on3dEnabledChange}
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
  const [is3dEnabled, setIs3dEnabled] = useState(true);

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
        >
          <Mapbox3DConceptsPanel
            isTerrainEnabled={isTerrainEnabled}
            onTerrainEnabledChange={setIsTerrainEnabled}
            is3dEnabled={is3dEnabled}
            on3dEnabledChange={setIs3dEnabled}
            scene={scene}
            onSceneChange={setScene}
          />
        </MapProvider>
      </div>
    </div>
  );
}
