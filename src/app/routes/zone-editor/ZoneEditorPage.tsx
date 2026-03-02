import { ZoneEditorSidebar } from './ZoneEditorSidebar';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

/**
 * Zone Editor page for defining and editing zones.
 */
export function ZoneEditorPage() {
  return (
    <div className="relative flex flex-1 min-h-0">
      <ZoneEditorSidebar />
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style="mapbox://styles/mapbox/satellite-streets-v12"
          center={airportById.get('BOS')?.coordinates}
          zoom={12}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
