import { useCallback, useMemo, useState } from 'react';

import { AircraftLayer } from './AircraftLayer';
import { SearchAreaLayer } from './SearchAreaLayer';
import { TrafficMonitorMapFit } from './TrafficMonitorMapFit';
import { TrafficMonitorSidebar } from './TrafficMonitorSidebar';
import { useTrafficData } from './useTrafficData';
import { computeBoundingBox } from './utils/boundingBox';
import { MAPBOX_DARK_STYLE } from '../../../config/MapConfig';
import { airportById } from '../../../gen/airports';
import { MapPanel, MapProvider, ZoomLevelDisplay } from '../../../lib/mapbox';

const DEFAULT_RADIUS_MILES = 2;

/**
 * Traffic Monitor page for viewing traffic-related data.
 */
export function TrafficMonitorPage() {
  const [selectedAirportId, setSelectedAirportId] = useState<string>();
  const [radiusMiles, setRadiusMiles] = useState<number>(DEFAULT_RADIUS_MILES);
  const [selectedAircraftId, setSelectedAircraftId] = useState<
    string | undefined
  >();

  const boundingBox = useMemo(() => {
    if (!selectedAirportId) return null;
    const airport = airportById.get(selectedAirportId);
    if (!airport) return null;
    return computeBoundingBox(airport.coordinates, radiusMiles);
  }, [selectedAirportId, radiusMiles]);

  const { aircraft, lastUpdated, loading, error, clear } =
    useTrafficData(boundingBox);

  // Undefined when the selected aircraft is no longer in the feed
  const effectiveSelectedAircraftId =
    selectedAircraftId != null &&
    aircraft.some((a) => a.icao24 === selectedAircraftId)
      ? selectedAircraftId
      : undefined;

  const handleAirportChange = useCallback(
    (airportId: string | undefined) => {
      setSelectedAirportId(airportId);
      if (airportId === undefined) {
        setSelectedAircraftId(undefined);
        clear();
      }
    },
    [clear],
  );

  const handleAircraftSelect = useCallback((icao24: string | undefined) => {
    setSelectedAircraftId(icao24);
  }, []);

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
        selectedAircraftId={effectiveSelectedAircraftId}
        onAircraftSelect={handleAircraftSelect}
      />
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style={MAPBOX_DARK_STYLE}
          center={airportById.get('BOS')?.coordinates}
          zoom={13}
          className="w-full h-full"
        >
          <MapPanel className="absolute right-3 top-3 z-10">
            <ZoomLevelDisplay />
          </MapPanel>
          <TrafficMonitorMapFit boundingBox={boundingBox} />
          <SearchAreaLayer boundingBox={boundingBox} />
          <AircraftLayer
            aircraft={aircraft}
            selectedAircraftId={effectiveSelectedAircraftId}
            onAircraftSelect={handleAircraftSelect}
          />
        </MapProvider>
      </div>
    </div>
  );
}
