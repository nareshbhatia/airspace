import { useContext } from 'react';

import { MapContext } from '../providers/MapContext';

/**
 * Returns the Mapbox GL `Map` instance from the nearest `MapProvider`.
 *
 * The returned `map` is `undefined` until the style has finished loading (after the
 * map `load` event). Guard against `undefined` before adding sources/layers or
 * calling map methods. Throws if called outside a `MapProvider`.
 *
 * @returns `{ map }` — the live `Map` instance or `undefined`.
 *
 * @example
 * ```ts
 * const { map } = useMap();
 *
 * useEffect(() => {
 *   if (!map) return;
 *   map.setCenter([-122.4, 37.8]);
 * }, [map]);
 * ```
 */
export function useMap() {
  const context = useContext(MapContext);
  if (context == null) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
