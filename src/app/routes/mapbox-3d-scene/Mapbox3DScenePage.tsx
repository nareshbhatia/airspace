import { useMemo, useState } from 'react';

import { MAPBOX_STANDARD_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import {
  BearingDisplay,
  BuildingsToggle,
  LayerTogglePanel,
  MapPanel,
  MapProvider,
  MapViewModeToggle,
  PitchDisplay,
  SceneSelector,
  useMapBuildingsToggle,
  useMapViewMode,
  ZoomLevelDisplay,
} from '../../../lib/mapbox';
import {
  addZones,
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

import type {
  AirspaceScene,
  LayerGroup,
  MapViewMode,
} from '../../../lib/mapbox';

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

interface MapboxOverlayProps {
  mapViewMode: MapViewMode;
  onMapViewModeChange: (mode: MapViewMode) => void;
  scene: AirspaceScene;
  onSceneChange: (scene: AirspaceScene) => void;
  isBuildingsEnabled: boolean;
  onBuildingsEnabledChange: (enabled: boolean) => void;
}

function MapboxOverlay({
  mapViewMode,
  onMapViewModeChange,
  scene,
  onSceneChange,
  isBuildingsEnabled,
  onBuildingsEnabledChange,
}: MapboxOverlayProps) {
  // Apply 2D vs 3D to the map view
  useMapViewMode(mapViewMode);

  // Toggle 3D buildings rendering
  useMapBuildingsToggle(isBuildingsEnabled);

  // Get the layer groups for the scene
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
 * Explore Mapbox concepts using the standard style.
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
          key={scene.name} // ask react to remount MapProvider when the scene changes
          {...scene.mapProvider}
          style={MAPBOX_STANDARD_STYLE}
          className="w-full h-full"
          mapOptions={{ antialias: true }}
          onLoad={(map) => {
            addZones(map, scene.zones);
            addPoles(map, scene.poles);
            addRoute(map, scene.route);
          }}
        >
          <MapboxOverlay
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
