import { Marker } from './Marker';
import { useMapEvent } from '../../../lib/mapbox';

import type { LngLat } from '../../../lib/mapbox';

export type MapClickEvent = { lngLat: LngLat };

interface MapClickMarkersProps {
  markers: LngLat[];
  onMapClick: (event: MapClickEvent) => void;
}

export function MapClickMarkers({ markers, onMapClick }: MapClickMarkersProps) {
  useMapEvent('click', (e) => {
    if (e.lngLat) {
      // Make a copy of Mapbox's LngLat object to return a library-agnostic type
      const lngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      onMapClick({ lngLat });
    }
  });

  return (
    <>
      {markers.map((marker) => (
        <Marker key={`${marker.lng}-${marker.lat}`} lngLat={marker} />
      ))}
    </>
  );
}
