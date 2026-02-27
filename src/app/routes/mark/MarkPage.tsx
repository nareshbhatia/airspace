import { useCallback, useState } from 'react';

import { MapClickMarkers } from './MapClickMarkers';
import { airportById } from '../../../data/airports';
import { MapProvider } from '../../../lib/mapbox';

import type { MapClickEvent } from './MapClickMarkers';
import type { LngLat } from '../../../lib/mapbox';

export function MarkPage() {
  const [markers, setMarkers] = useState<LngLat[]>([]);

  const handleMapClick = useCallback((event: MapClickEvent) => {
    setMarkers((prev) => [...prev, event.lngLat]);
  }, []);

  return (
    <div className="relative flex-1">
      <MapProvider
        style="mapbox://styles/mapbox/standard"
        center={airportById.get('BOS')?.coordinates}
        zoom={12}
        className="w-full h-full"
      >
        <MapClickMarkers markers={markers} onMapClick={handleMapClick} />
      </MapProvider>
    </div>
  );
}
