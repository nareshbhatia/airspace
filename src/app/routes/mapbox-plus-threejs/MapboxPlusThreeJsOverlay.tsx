import { useMemo } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Field, FieldLabel } from '../../../components/ui/field';
import {
  BearingDisplay,
  MapPanel,
  MapViewModeToggle,
  PitchDisplay,
  SceneSelector,
  TerrainSwitch,
  ZoomLevelDisplay,
  useMapViewMode,
} from '../../../lib/mapbox';
import { cn } from '../../../utils/cn';

import type {
  ThreeSceneLayerGroupId,
  ThreeSceneVisibilityState,
} from './types';
import type { AirspaceScene, MapViewMode } from '../../../lib/mapbox';

interface LayerToggleConfig {
  id: ThreeSceneLayerGroupId;
  label: string;
}

const LAYER_TOGGLE_CONFIGS: LayerToggleConfig[] = [
  { id: 'zones', label: 'Zones' },
  { id: 'poles', label: 'Poles' },
  { id: 'route', label: 'Route' },
];

export interface MapboxPlusThreeJsOverlayProps {
  mapViewMode: MapViewMode;
  onMapViewModeChange: (mode: MapViewMode) => void;
  scene: AirspaceScene;
  scenes: AirspaceScene[];
  onSceneChange: (scene: AirspaceScene) => void;
  isTerrainEnabled: boolean;
  onTerrainEnabledChange: (isTerrainEnabled: boolean) => void;
  visibilityState: ThreeSceneVisibilityState;
  onVisibilityStateChange: (next: ThreeSceneVisibilityState) => void;
  className?: string;
}

/**
 * Overlay controls for the Mapbox + Three.js page.
 * Keeps page-level orchestration separate from interactive map UI.
 */
export function MapboxPlusThreeJsOverlay({
  mapViewMode,
  onMapViewModeChange,
  scene,
  scenes,
  onSceneChange,
  isTerrainEnabled,
  onTerrainEnabledChange,
  visibilityState,
  onVisibilityStateChange,
  className,
}: MapboxPlusThreeJsOverlayProps) {
  /** Apply 2D/3D camera mode directly to Mapbox. */
  useMapViewMode(mapViewMode);

  const layerToggles = useMemo(
    () =>
      LAYER_TOGGLE_CONFIGS.map((config) => ({
        ...config,
        checked: visibilityState[config.id],
      })),
    [visibilityState],
  );

  return (
    <div
      className={cn(
        'absolute right-3 top-3 z-10 flex min-w-40 flex-col gap-2',
        className,
      )}
    >
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

      <Card size="sm" className="rounded-md">
        <CardHeader>
          <CardTitle>Layers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-0">
          <ul className="flex flex-col gap-2" role="group" aria-label="Layers">
            {layerToggles.map((toggle) => (
              <li key={toggle.id}>
                <Field orientation="horizontal">
                  <Checkbox
                    id={`three-layer-toggle-${toggle.id}`}
                    checked={toggle.checked}
                    onCheckedChange={(checked) => {
                      onVisibilityStateChange({
                        ...visibilityState,
                        [toggle.id]: checked,
                      });
                    }}
                    aria-label={`Toggle ${toggle.label}`}
                  />
                  <FieldLabel
                    htmlFor={`three-layer-toggle-${toggle.id}`}
                    className="cursor-pointer text-foreground font-normal"
                  >
                    {toggle.label}
                  </FieldLabel>
                </Field>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
