import { useMemo, useState } from 'react';

import { MAPBOX_STANDARD_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import { BearingDisplay } from '../../../lib/mapbox/components/BearingDisplay';
import { BuildingsToggle } from '../../../lib/mapbox/components/BuildingsToggle';
import { LayerTogglePanel } from '../../../lib/mapbox/components/LayerTogglePanel';
import { MapPanel } from '../../../lib/mapbox/components/MapPanel';
import { MapViewModeToggle } from '../../../lib/mapbox/components/MapViewModeToggle';
import { PitchDisplay } from '../../../lib/mapbox/components/PitchDisplay';
import { SceneSelector } from '../../../lib/mapbox/components/SceneSelector';
import { ZoomLevelDisplay } from '../../../lib/mapbox/components/ZoomLevelDisplay';
import { useMapBuildingsToggle } from '../../../lib/mapbox/hooks/useMapBuildingsToggle';
import { useMapViewMode } from '../../../lib/mapbox/hooks/useMapViewMode';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import {
  addAirspaceZones,
  addRoute,
  addPoles,
  AIRSPACE_ZONE_LAYER_ID_PREFIX,
  ROUTE_CASING_LAYER_ID,
  ROUTE_LINE_LAYER_ID,
  POLE_LABELS_LAYER_ID,
  POLE_MARKERS_LAYER_ID,
  WAYPOINT_MARKERS_LAYER_ID,
} from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

import type { LayerGroup } from '../../../lib/mapbox/components/LayerTogglePanel';
import type { AirspaceScene } from '../../../lib/mapbox/types/AirspaceScene';
import type { MapViewMode } from '../../../lib/mapbox/types/MapViewMode';

function getLayerGroupsForScene(scene: AirspaceScene): LayerGroup[] {
  return [
    {
      id: 'zones',
      label: 'Zones',
      layerIds: scene.zones.map(
        (z) => `${AIRSPACE_ZONE_LAYER_ID_PREFIX}${z.id}`,
      ),
    },
    {
      id: 'poles',
      label: 'Poles',
      layerIds: [POLE_MARKERS_LAYER_ID, POLE_LABELS_LAYER_ID],
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
  mapViewMode: MapViewMode;
  onMapViewModeChange: (mode: MapViewMode) => void;
  scene: AirspaceScene;
  onSceneChange: (scene: AirspaceScene) => void;
  isBuildingsEnabled: boolean;
  onBuildingsEnabledChange: (enabled: boolean) => void;
}

function Mapbox3DSceneOverlay({
  mapViewMode,
  onMapViewModeChange,
  scene,
  onSceneChange,
  isBuildingsEnabled,
  onBuildingsEnabledChange,
}: Mapbox3DSceneOverlayProps) {
  useMapViewMode(mapViewMode);
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
      <LayerTogglePanel layerGroups={layerGroups} />
    </div>
  );
}

/**
 * Mapbox 3D Scene page for viewing a 3D map scene.
 */
export function Mapbox3DScenePage() {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');
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
            addPoles(map, scene.poles);
            addRoute(map, scene.route);
          }}
        >
          <Mapbox3DSceneOverlay
            mapViewMode={mapViewMode}
            onMapViewModeChange={setMapViewMode}
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
