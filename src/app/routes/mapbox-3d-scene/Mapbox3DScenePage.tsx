import { LayerTogglePanel } from './LayerTogglePanel';
import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { scene } from '../../../data/scene3d-john-hancock';
import { MapPanel } from '../../../lib/mapbox/controls/MapPanel';
import { ZoomLevelDisplay } from '../../../lib/mapbox/controls/ZoomLevelDisplay';
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
          {...scene.mapProvider}
          style={MAPBOX_STANDARD_SATELLITE_STYLE}
          className="w-full h-full"
          mapOptions={{ antialias: true }}
          onLoad={(map) => {
            addBuildings(map);
            addAirspaceZones(map, scene.zones);
            addUtilityPoles(map, scene.poles);
            addInspectionRoute(map, scene.inspectionRoute);
          }}
        >
          <div className="absolute right-3 top-3 z-10 flex flex-row items-start gap-3">
            <LayerTogglePanel layerGroups={LAYER_GROUPS} />
            <MapPanel>
              <ZoomLevelDisplay />
            </MapPanel>
          </div>
        </MapProvider>
      </div>
    </div>
  );
}
