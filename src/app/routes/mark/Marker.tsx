import { useEffect } from 'react';

import { Marker as MapboxMarker } from 'mapbox-gl';

import { useMap } from '../../../lib/mapbox';

import type { LngLat } from '../../../lib/mapbox';

interface MarkerProps {
  lngLat: LngLat;
}

export function Marker({ lngLat }: MarkerProps) {
  const { map } = useMap();
  const { lng, lat } = lngLat;

  useEffect(() => {
    if (!map) return;

    const marker = new MapboxMarker({ color: 'red' })
      .setLngLat([lng, lat])
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, lng, lat]);

  return null;
}
