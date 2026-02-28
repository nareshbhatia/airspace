import { useEffect } from 'react';

import { useMap } from './useMap';

import type { LngLat } from '../types/LngLat';

export interface UseFlyToOptions {
  zoom?: number;
  duration?: number;
  pitch?: number;
  bearing?: number;
}

/**
 * Smoothly flies the map to a given coordinate whenever it changes.
 *
 * Calls `map.flyTo()` reactively — each time `center` or any option value
 * changes, the map animates to the new position. Omit `center` or pass
 * `undefined` to skip the animation (e.g. when no location is selected).
 *
 * @param center - Target coordinates, or `undefined` to do nothing.
 * @param options.zoom - Zoom level at the destination.
 * @param options.duration - Animation duration in milliseconds.
 * @param options.pitch - Pitch in degrees at the destination.
 * @param options.bearing - Bearing in degrees at the destination.
 *
 * @example
 * ```ts
 * const [selected, setSelected] = useState<LngLat>();
 * useFlyTo(selected, { zoom: 14, duration: 2000 });
 * ```
 */
export function useFlyTo(center?: LngLat, options: UseFlyToOptions = {}) {
  const { map } = useMap();

  const lng = center?.lng;
  const lat = center?.lat;
  const { zoom, duration, pitch, bearing } = options;

  useEffect(() => {
    // Use == null so we allow 0 as a valid coordinate (e.g. [0, 0]).
    if (!map || lng == null || lat == null) return;

    map.flyTo({
      center: [lng, lat],
      ...(zoom != null && { zoom }),
      ...(duration != null && { duration }),
      ...(pitch != null && { pitch }),
      ...(bearing != null && { bearing }),
    });
  }, [map, lng, lat, zoom, duration, pitch, bearing]);
}
