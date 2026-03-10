import { LayerTogglePanel } from './LayerTogglePanel';
import {
  airspaceZones,
  inspectionRoute,
  MAP_CENTER,
  MAP_VIEW,
  utilityPoles,
} from '../../../data/scene3d';
import { ZoomControl } from '../../../lib/mapbox/controls/ZoomControl';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import {
  addAirspaceZones,
  addBuildings,
  addInspectionRoute,
  addUtilityPoles,
  AIRSPACE_ZONE_LAYER_ID_PREFIX,
  BUILDINGS_LAYER_ID,
  ROUTE_CASING_LAYER_ID,
  ROUTE_LINE_LAYER_ID,
  UTILITY_POLE_LABELS_LAYER_ID,
  UTILITY_POLE_MARKERS_LAYER_ID,
  WAYPOINT_MARKERS_LAYER_ID,
} from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

import type { LayerGroupConfig } from './LayerTogglePanel';

const LAYER_GROUPS: LayerGroupConfig[] = [
  { id: 'buildings', label: 'Buildings', layerIds: [BUILDINGS_LAYER_ID] },
  {
    id: 'zones',
    label: 'Airspace zones',
    layerIds: airspaceZones.map(
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

/**
 * Mapbox 3D Scene page for viewing a 3D map scene.
 */
export function Mapbox3DScenePage() {
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
          onLoad={(map) => {
            addBuildings(map);
            addAirspaceZones(map, airspaceZones);
            addUtilityPoles(map, utilityPoles);
            addInspectionRoute(map, inspectionRoute);
          }}
          className="w-full h-full"
        >
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-3">
            <ZoomControl
              position="top-right"
              className="relative top-0 right-0"
            />
            <LayerTogglePanel layerGroups={LAYER_GROUPS} />
          </div>
        </MapProvider>
      </div>
    </div>
  );
}
