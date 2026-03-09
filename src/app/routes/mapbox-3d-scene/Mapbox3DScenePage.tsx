import {
  airspaceZones,
  MAP_CENTER,
  MAP_VIEW,
  utilityPoles,
} from '../../../data/scene3d';
import { ZoomControl } from '../../../lib/mapbox/controls/ZoomControl';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import {
  addAirspaceZones,
  addBuildings,
  addUtilityPoles,
} from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

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
          }}
          className="w-full h-full"
        >
          <ZoomControl />
        </MapProvider>
      </div>
    </div>
  );
}
