import { addThreeJsCustomLayer } from './addThreeJsCustomLayer';
import { MAP_CENTER, MAP_VIEW } from '../../../data/scene3d';
import { ZoomControl } from '../../../lib/mapbox/controls/ZoomControl';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import { addBuildings } from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

/**
 * Mapbox + Three.js page: pitched satellite map with Mapbox 3D buildings
 * (fill-extrusion). Step 1 establishes the base map; later steps add a
 * custom layer and Three.js content.
 */
export function MapboxPlusThreeJsPage() {
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
            addThreeJsCustomLayer(map);
          }}
          className="w-full h-full"
        >
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-3">
            <ZoomControl
              position="top-right"
              className="relative top-0 right-0"
            />
          </div>
        </MapProvider>
      </div>
    </div>
  );
}
