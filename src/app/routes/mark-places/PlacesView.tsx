import { Marker } from './Marker';
import { useFlyTo, useMapEvent } from '../../../lib/mapbox';

import type { Place } from './types/Place';
import type { LngLat } from '../../../lib/mapbox';

export type MapClickEvent = { lngLat: LngLat };

interface PlacesViewProps {
  places: Place[];
  selectedPlaceId?: string;
  onMapClick: (event: MapClickEvent) => void;
}

export function PlacesView({
  places,
  selectedPlaceId,
  onMapClick,
}: PlacesViewProps) {
  const selectedPlace = selectedPlaceId
    ? places.find((p) => p.id === selectedPlaceId)
    : undefined;
  useFlyTo(selectedPlace?.coordinates ?? null, { zoom: 12, duration: 2000 });

  useMapEvent('click', (e) => {
    if (e.lngLat) {
      // Make a copy of Mapbox's LngLat object to return a library-agnostic type
      const lngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      onMapClick({ lngLat });
    }
  });

  return (
    <>
      {places.map((place) => (
        <Marker key={place.id} lngLat={place.coordinates} />
      ))}
    </>
  );
}
