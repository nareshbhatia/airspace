import { useMemo, useState } from 'react';

import { SearchAreaLayer } from './SearchAreaLayer';
import { TrafficMonitorMapFit } from './TrafficMonitorMapFit';
import { TrafficMonitorSidebar } from './TrafficMonitorSidebar';
import { RadiusMilesEnum } from './types';
import { computeBoundingBox } from './utils/boundingBox';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

import type { RadiusMiles } from './types';

/**
 * Traffic Monitor page for viewing traffic-related data.
 */
export function TrafficMonitorPage() {
  const [selectedAirportId, setSelectedAirportId] = useState<string>();
  const [radiusMiles, setRadiusMiles] = useState<RadiusMiles>(
    RadiusMilesEnum.Hundred,
  );

  const boundingBox = useMemo(() => {
    if (!selectedAirportId) return null;
    const airport = airportById.get(selectedAirportId);
    if (!airport) return null;
    return computeBoundingBox(airport.coordinates, radiusMiles);
  }, [selectedAirportId, radiusMiles]);

  return (
    <div className="relative flex flex-1 min-h-0">
      <TrafficMonitorSidebar
        selectedAirportId={selectedAirportId}
        onAirportChange={setSelectedAirportId}
        radiusMiles={radiusMiles}
        onRadiusChange={setRadiusMiles}
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
        </MapProvider>
      </div>
    </div>
  );
}
