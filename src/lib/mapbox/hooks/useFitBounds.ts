import { useEffect } from 'react';

import { useMap } from './useMap';

import type { LngLatBoundsLike } from 'mapbox-gl';

export interface UseFitBoundsOptions {
  padding?:
    | number
    | { top: number; bottom: number; left: number; right: number };
  duration?: number;
  maxZoom?: number;
  linear?: boolean;
}

/**
 * Fits the map view to the given bounds whenever they change.
 *
 * Calls `map.fitBounds()` reactively so that "fit to features" or "show all
 * markers" flows are easy to implement. Pass `null` to skip (e.g. when no
 * selection). Follows Mapbox best practice for fitting bounds with padding
 * and animation.
 *
 * @param bounds - Target bounds as `[[west, south], [east, north]]` or `[west, south, east, north]`, or `null` to do nothing.
 * @param options.padding - Padding in pixels or `{ top, bottom, left, right }`.
 * @param options.duration - Animation duration in milliseconds.
 * @param options.maxZoom - Maximum zoom level when fitting.
 * @param options.linear - If `true`, use linear ease instead of fly.
 *
 * @example
 * ```ts
 * const bounds = useMemo(() => bbox(featureCollection), [features]);
 * useFitBounds(bounds, { padding: 40, maxZoom: 14 });
 * ```
 */
export function useFitBounds(
  bounds: LngLatBoundsLike | null,
  options: UseFitBoundsOptions = {},
): void {
  const { map } = useMap();
  const { padding, duration, maxZoom, linear } = options;

  useEffect(() => {
    if (!map || !bounds) return;

    map.fitBounds(bounds, {
      ...(padding != null && { padding }),
      ...(duration != null && { duration }),
      ...(maxZoom != null && { maxZoom }),
      ...(linear != null && { linear }),
    });
  }, [map, bounds, padding, duration, maxZoom, linear]);
}
