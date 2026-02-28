import { useState } from 'react';

import { TrafficMonitorSidebar } from './TrafficMonitorSidebar';
import { MapProvider } from '../../../lib/mapbox';

/**
 * Traffic Monitor page for viewing traffic-related data.
 */
export function TrafficMonitorPage() {
  const [selectedAirportId, setSelectedAirportId] = useState<string>();

  return (
    <div className="relative flex flex-1 min-h-0">
      <TrafficMonitorSidebar
        selectedAirportId={selectedAirportId}
        onAirportChange={setSelectedAirportId}
      />
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style="mapbox://styles/mapbox/dark-v11"
          center={[-98.5, 39.8]}
          zoom={4}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
