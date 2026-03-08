import { ZoomControl } from '../../../lib/mapbox/controls/ZoomControl';
import { MapProvider } from '../../../lib/mapbox/providers/MapProvider';
import { addBuildings } from '../../../lib/mapbox/scene3d';
import { cn } from '../../../utils/cn';

/** John Hancock Tower, Boston (200 Clarendon Street). [lng, lat]. */
const JOHN_HANCOCK_TOWER: [number, number] = [-71.0752, 42.3496];

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
          center={JOHN_HANCOCK_TOWER}
          zoom={17}
          pitch={80}
          bearing={-20}
          mapOptions={{ antialias: true }}
          onLoad={(map) => addBuildings(map)}
          className="w-full h-full"
        >
          <ZoomControl />
        </MapProvider>
      </div>
    </div>
  );
}
