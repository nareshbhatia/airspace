import { useState } from 'react';

import { ButtonPanel } from './ButtonPanel';
import { FlyToAirport } from './FlyToAirport';
import { airportById } from '../../../data/airports';
import { MapProvider } from '../../../lib/mapbox';

export function NavigatePage() {
  const [selectedAirportId, setSelectedAirportId] = useState<string>();

  return (
    <div className="relative flex-1">
      <MapProvider
        style="mapbox://styles/mapbox/standard"
        center={airportById.get('BOS')?.coordinates}
        zoom={14}
        className="w-full h-full"
      >
        <FlyToAirport selectedAirportId={selectedAirportId} />
      </MapProvider>
      <ButtonPanel onAirportSelect={setSelectedAirportId} />
    </div>
  );
}
