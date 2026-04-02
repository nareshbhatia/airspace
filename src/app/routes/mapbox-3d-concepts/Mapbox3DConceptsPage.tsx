import { useState } from 'react';

import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import {
  BearingDisplay,
  MapPanel,
  MapProvider,
  PitchDisplay,
  SceneSelector,
  TerrainSwitch,
  ZoomLevelDisplay,
} from '../../../lib/mapbox';
import { cn } from '../../../utils/cn';

/**
 * Minimal Mapbox page used for 3D concepts exploration.
 */
export function Mapbox3DConceptsPage() {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [isTerrainEnabled, setIsTerrainEnabled] = useState(true);

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
          <MapPanel className="absolute right-3 top-3 z-10">
            <ZoomLevelDisplay />
            <PitchDisplay />
            <BearingDisplay />
            <TerrainSwitch
              isTerrainEnabled={isTerrainEnabled}
              onTerrainEnabledChange={setIsTerrainEnabled}
            />
            <SceneSelector
              scenes={scenes}
              selectedScene={scene}
              onSceneChange={setScene}
            />
          </MapPanel>
        </MapProvider>
      </div>
    </div>
  );
}
