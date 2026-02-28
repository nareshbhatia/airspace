import { useCallback, useState } from 'react';

import { PlacesList } from './PlacesList';
import { PlacesView } from './PlacesView';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

import type { MapClickEvent } from './PlacesView';
import type { Place } from './types/Place';

export function MarkPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();

  const handleMapClick = useCallback((event: MapClickEvent) => {
    const place = {
      id: crypto.randomUUID(),
      coordinates: event.lngLat,
    };
    setPlaces((prev) => [...prev, place]);
  }, []);

  const handlePlaceSelected = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
  }, []);

  const handlePlaceDeleted = useCallback((placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    setSelectedPlaceId((prev) => (prev === placeId ? undefined : prev));
  }, []);

  return (
    <div className="relative flex flex-1 min-h-0">
      <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-background">
        <div className="border-b border-border px-3 py-2 text-sm font-medium">
          Places
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <PlacesList
            places={places}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelected={handlePlaceSelected}
            onPlaceDeleted={handlePlaceDeleted}
          />
        </div>
      </aside>
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style="mapbox://styles/mapbox/standard"
          center={airportById.get('BOS')?.coordinates}
          zoom={12}
          className="w-full h-full"
        >
          <PlacesView
            places={places}
            selectedPlaceId={selectedPlaceId}
            onMapClick={handleMapClick}
          />
        </MapProvider>
      </div>
    </div>
  );
}
