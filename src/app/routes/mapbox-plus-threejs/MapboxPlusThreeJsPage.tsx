import { useMemo, useState } from 'react';

import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import {
  BearingDisplay,
  LayerTogglePanel,
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
  isTerrainEnabled: boolean;
  onTerrainEnabledChange: (isTerrainEnabled: boolean) => void;
}

function MapboxOverlay({
  mapViewMode,
  onMapViewModeChange,
  scene,
  onSceneChange,
  isTerrainEnabled,
  onTerrainEnabledChange,
}: MapboxOverlayProps) {
  // Apply 2D vs 3D to the map view
  useMapViewMode(mapViewMode);

  // Get the layer groups for the scene
  const layerGroups = useMemo(() => getLayerGroupsForScene(scene), [scene]);

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 min-w-40">
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
      <LayerTogglePanel layerGroups={layerGroups} />
    </div>
  );
}

/**
 * Explore Mapbox + Three.js integration.
 */
export function MapboxPlusThreeJsPage() {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');
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
          <MapboxOverlay
            mapViewMode={mapViewMode}
            onMapViewModeChange={setMapViewMode}
            scene={scene}
            onSceneChange={setScene}
            isTerrainEnabled={isTerrainEnabled}
            onTerrainEnabledChange={setIsTerrainEnabled}
          />
        </MapProvider>
      </div>
    </div>
  );
}
