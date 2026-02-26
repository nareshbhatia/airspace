import { useEffect, useRef } from 'react';

import { useMap } from './useMap';

import type { MapEventOf, MapEventType } from 'mapbox-gl';

/**
 * Subscribes to a Mapbox GL map event for the lifetime of the component.
 *
 * The listener is attached when the map is ready and removed on unmount or
 * when `event`/`layerId` changes. The `handler` is held in a ref, so it
 * does not need to be memoized and swapping it won't re-subscribe.
 *
 * @param event - The map event name (e.g. `'click'`, `'moveend'`).
 * @param handler - Callback invoked with the event object. Does not need to be memoized.
 * @param layerId - Optional layer id to scope the event to a specific layer.
 *
 * @example
 * ```ts
 * // Listen to all map clicks
 * useMapEvent('click', (e) => console.log('clicked', e));
 *
 * // Listen to clicks on a specific layer
 * useMapEvent('click', (e) => console.log('feature clicked', e), 'airports');
 * ```
 */
export function useMapEvent<T extends MapEventType | string>(
  event: T,
  handler: (ev: T extends MapEventType ? MapEventOf<T> : unknown) => void,
  layerId?: string,
): void {
  const { map } = useMap();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!map) return;

    const wrapped = (e: unknown) => {
      handlerRef.current(e as T extends MapEventType ? MapEventOf<T> : unknown);
    };

    if (layerId != null) {
      map.on(event, layerId, wrapped);
      return () => {
        map.off(event, layerId, wrapped);
      };
    }
    map.on(event, wrapped);
    return () => {
      map.off(event, wrapped);
    };
  }, [map, event, layerId]);
}
