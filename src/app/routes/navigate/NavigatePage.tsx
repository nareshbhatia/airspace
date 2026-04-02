import { useState } from 'react';

import { ButtonPanel } from './ButtonPanel';
import { FlyToAirport } from './FlyToAirport';
import { MAPBOX_STANDARD_STYLE } from '../../../config/MapConfig';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

export function NavigatePage() {
  const [selectedAirportId, setSelectedAirportId] = useState<string>();

  return (
    <div className="relative flex-1">
      <MapProvider
        style={MAPBOX_STANDARD_STYLE}
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
