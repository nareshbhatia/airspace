import { airportById } from '../../../gen/airports';
import { MapProvider, ZoomControl } from '../../../lib/mapbox';

/**
 * Flightpath page for flightpath-related operations.
 */
export function FlightpathPage() {
  return (
    <div className="relative flex-1 min-h-0">
      <MapProvider
        style="mapbox://styles/mapbox/dark-v11"
        center={airportById.get('BOS')?.coordinates}
        zoom={13}
        className="w-full h-full"
      >
        <ZoomControl />
      </MapProvider>
    </div>
  );
}
