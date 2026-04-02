import { useMemo, useState } from 'react';

import { MAPBOX_STANDARD_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import { BearingDisplay } from '../../../lib/mapbox/components/BearingDisplay';
import { BuildingsToggle } from '../../../lib/mapbox/components/BuildingsToggle';
import { LayerTogglePanel } from '../../../lib/mapbox/components/LayerTogglePanel';
import { MapPanel } from '../../../lib/mapbox/components/MapPanel';
import { PitchDisplay } from '../../../lib/mapbox/components/PitchDisplay';
import { PitchToggle } from '../../../lib/mapbox/components/PitchToggle';
import { SceneSelector } from '../../../lib/mapbox/components/SceneSelector';
import { ZoomLevelDisplay } from '../../../lib/mapbox/components/ZoomLevelDisplay';
import { useMapBuildingsToggle } from '../../../lib/mapbox/hooks/useMapBuildingsToggle';
import { useMapPitch3dToggle } from '../../../lib/mapbox/hooks/useMapPitch3dToggle';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import {
  addAirspaceZones,
  addInspectionRoute,
  addUtilityPoles,
  AIRSPACE_ZONE_LAYER_ID_PREFIX,
  ROUTE_CASING_LAYER_ID,
  ROUTE_LINE_LAYER_ID,
  UTILITY_POLE_LABELS_LAYER_ID,
  UTILITY_POLE_MARKERS_LAYER_ID,
  WAYPOINT_MARKERS_LAYER_ID,
} from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

import type { LayerGroup } from '../../../lib/mapbox/components/LayerTogglePanel';
import type { AirspaceScene } from '../../../lib/mapbox/types/AirspaceScene';

function getLayerGroupsForScene(scene: AirspaceScene): LayerGroup[] {
  return [
    {
      id: 'zones',
      label: 'Airspace zones',
      layerIds: scene.zones.map(
        (z) => `${AIRSPACE_ZONE_LAYER_ID_PREFIX}${z.id}`,
      ),
    },
    {
      id: 'poles',
      label: 'Utility poles',
      layerIds: [UTILITY_POLE_MARKERS_LAYER_ID, UTILITY_POLE_LABELS_LAYER_ID],
    },
    {
      id: 'route',
      label: 'Route',
      layerIds: [
        ROUTE_CASING_LAYER_ID,
        ROUTE_LINE_LAYER_ID,
        WAYPOINT_MARKERS_LAYER_ID,
      ],
    },
  ];
}

interface Mapbox3DSceneOverlayProps {
  is3dEnabled: boolean;
  on3dEnabledChange: (is3dEnabled: boolean) => void;
  scene: AirspaceScene;
  onSceneChange: (scene: AirspaceScene) => void;
  isBuildingsEnabled: boolean;
  onBuildingsEnabledChange: (enabled: boolean) => void;
}

function Mapbox3DSceneOverlay({
  is3dEnabled,
  on3dEnabledChange,
  scene,
  onSceneChange,
  isBuildingsEnabled,
  onBuildingsEnabledChange,
}: Mapbox3DSceneOverlayProps) {
  useMapPitch3dToggle(is3dEnabled);
  useMapBuildingsToggle(isBuildingsEnabled);

  const layerGroups = useMemo(() => getLayerGroupsForScene(scene), [scene]);

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 min-w-40">
      <MapPanel>
        <ZoomLevelDisplay />
        <PitchDisplay />
        <BearingDisplay />
        <BuildingsToggle
          isBuildingsEnabled={isBuildingsEnabled}
          onBuildingsEnabledChange={onBuildingsEnabledChange}
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
      <LayerTogglePanel layerGroups={layerGroups} />
    </div>
  );
}

/**
 * Mapbox 3D Scene page for viewing a 3D map scene.
 */
export function Mapbox3DScenePage() {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [is3dEnabled, setIs3dEnabled] = useState(true);
  const [isBuildingsEnabled, setIsBuildingsEnabled] = useState(true);

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
          style={MAPBOX_STANDARD_STYLE}
          className="w-full h-full"
          mapOptions={{ antialias: true }}
          onLoad={(map) => {
            addAirspaceZones(map, scene.zones);
            addUtilityPoles(map, scene.poles);
            addInspectionRoute(map, scene.inspectionRoute);
          }}
        >
          <Mapbox3DSceneOverlay
            is3dEnabled={is3dEnabled}
            on3dEnabledChange={setIs3dEnabled}
            scene={scene}
            onSceneChange={setScene}
            isBuildingsEnabled={isBuildingsEnabled}
            onBuildingsEnabledChange={setIsBuildingsEnabled}
          />
        </MapProvider>
      </div>
    </div>
  );
}
