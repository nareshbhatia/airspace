import { DroneLayer } from './DroneLayer';
import { FlightpathFlyToSelected } from './FlightpathFlyToSelected';
import { MAPBOX_DARK_STYLE } from '../../../config/MapConfig';
import { airportById } from '../../../gen/airports';
import { MapPanel, MapProvider, ZoomLevelDisplay } from '../../../lib/mapbox';
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
        style={MAPBOX_DARK_STYLE}
        center={airportById.get('BOS')?.coordinates}
        zoom={13}
        className="w-full h-full"
      >
        <DroneLayer />
        <FlightpathFlyToSelected />
        <MapPanel className="absolute right-3 top-3 z-10">
          <ZoomLevelDisplay />
        </MapPanel>
      </MapProvider>
    </div>
  );
}
