import { airportById } from '../../../gen/airports';
import { MapProvider, ZoomControl } from '../../../lib/mapbox';
import { cn } from '../../../utils/cn';

interface FlightpathMapProps {
  className?: string;
}

/**
 * Map panel for the Flightpath page. Renders a full-height Mapbox map
 * with dark style centered on Boston.
 */
export function FlightpathMap({ className }: FlightpathMapProps) {
  return (
    <div className={cn('relative w-full h-full min-h-0', className)}>
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
