import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

/**
 * Zone Editor page for defining and editing zones.
 */
export function ZoneEditorPage() {
  return (
    <div className="relative flex flex-1 min-h-0">
      <MapProvider
        style="mapbox://styles/mapbox/dark-v11"
        center={airportById.get('BOS')?.coordinates}
        zoom={12}
        className="w-full h-full"
      />
    </div>
  );
}
