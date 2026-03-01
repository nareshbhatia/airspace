import { useCallback, useMemo, useState } from 'react';

import { AircraftLayer } from './AircraftLayer';
import { SearchAreaLayer } from './SearchAreaLayer';
import { TrafficMonitorMapFit } from './TrafficMonitorMapFit';
import { TrafficMonitorSidebar } from './TrafficMonitorSidebar';
import { useTrafficData } from './useTrafficData';
import { computeBoundingBox } from './utils/boundingBox';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

const DEFAULT_RADIUS_MILES = 2;

/**
 * Traffic Monitor page for viewing traffic-related data.
 */
export function TrafficMonitorPage() {
  const [selectedAirportId, setSelectedAirportId] = useState<string>();
  const [radiusMiles, setRadiusMiles] = useState<number>(DEFAULT_RADIUS_MILES);

  const boundingBox = useMemo(() => {
    if (!selectedAirportId) return null;
    const airport = airportById.get(selectedAirportId);
    if (!airport) return null;
    return computeBoundingBox(airport.coordinates, radiusMiles);
  }, [selectedAirportId, radiusMiles]);

  const { aircraft, lastUpdated, loading, error, clear } =
    useTrafficData(boundingBox);

  const handleAirportChange = useCallback(
    (airportId: string | undefined) => {
      setSelectedAirportId(airportId);
      if (airportId === undefined) clear();
    },
    [clear],
  );

  return (
    <div className="relative flex flex-1 min-h-0">
      <TrafficMonitorSidebar
        selectedAirportId={selectedAirportId}
        onAirportChange={handleAirportChange}
        radiusMiles={radiusMiles}
        onRadiusChange={setRadiusMiles}
        aircraft={aircraft}
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
      />
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style="mapbox://styles/mapbox/dark-v11"
          center={[-98.5, 39.8]}
          zoom={4}
          className="w-full h-full"
        >
          <TrafficMonitorMapFit boundingBox={boundingBox} />
          <SearchAreaLayer boundingBox={boundingBox} />
          <AircraftLayer aircraft={aircraft} />
        </MapProvider>
      </div>
    </div>
  );
}
