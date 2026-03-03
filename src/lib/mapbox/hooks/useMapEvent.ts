import { useEffect, useEffectEvent } from 'react';

import { useMap } from './useMap';

import type { MapEventOf, MapEventType } from 'mapbox-gl';

/**
 * Subscribes to a Mapbox map event for the lifetime of the component.
 *
 * **Map-level subscription:** The handler runs for every occurrence of the event
 * anywhere on the map (e.g. every click). Use this for "click outside" logic,
 * custom hit-testing with `queryRenderedFeatures`, or global actions. Omit `layerId`
 * to subscribe at map level.
 *
 * **Layer-scoped subscription:** The handler runs only when the event occurs on a
 * given layer or set of layers (e.g. click on a zone fill or outline). Use this to
 * react to interaction with specific map layers. Pass `layerId` as a string or
 * array of layer ids to scope the event.
 *
 * The listener is attached when the map is ready and removed on unmount or when
 * `event`/`layerId` changes. The `handler` does not need to be memoized; it always
 * sees the latest props/state via `useEffectEvent`.
 *
 * @param event - The map event name (e.g. `'click'`, `'moveend'`).
 * @param handler - Callback invoked with the event object. Does not need to be memoized.
 * @param layerId - Optional layer id or array of layer ids to scope the event. Pass a stable reference (e.g. module-level constant) when using an array so the effect does not re-run every render.
 *
 * @example
 * ```ts
 * // Listen to all map clicks
 * useMapEvent('click', (e) => console.log('clicked', e));
 *
 * // Listen to clicks on a specific layer
 * useMapEvent('click', (e) => console.log('feature clicked', e), 'airports');
 *
 * // Listen to clicks on any of several layers
 * const LAYER_IDS = ['fill-layer', 'line-layer'] as const;
 * useMapEvent('click', (e) => console.log(e.features), LAYER_IDS);
 * ```
 */
export function useMapEvent<T extends MapEventType | string>(
  event: T,
  handler: (ev: T extends MapEventType ? MapEventOf<T> : unknown) => void,
  layerId?: string | readonly string[],
): void {
  const { map } = useMap();
  // Always invokes the latest handler passed by the caller, so handler need not be memoized.
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    if (!map) return;

    // Single function we register with Mapbox so we can pass the same reference to map.off
    // in cleanup. When Mapbox fires the event, it calls wrapped(e); we forward to onEvent(e)
    // so the current handler runs. We do not register onEvent directly because we need a
    // stable reference for removal, and the type cast is applied here.
    const wrapped = (e: unknown) => {
      onEvent(e as T extends MapEventType ? MapEventOf<T> : unknown);
    };

    if (layerId != null) {
      // Layer-scoped: Mapbox calls wrapped only when the event occurs on this layer (or any of these layers).
      // Three-argument form: (eventName, layerIdOrIds, listener). Array support: PR #11114.
      const layerArg = layerId as string | string[];
      map.on(event, layerArg, wrapped);
      return () => {
        map.off(event, layerArg, wrapped);
      };
    }

    // Map-level: Mapbox calls wrapped for every occurrence of the event anywhere on the map.
    // Two-argument form: (eventName, listener). Use for e.g. "click outside" or custom hit-testing.
    map.on(event, wrapped);
    return () => {
      map.off(event, wrapped);
    };
  }, [map, event, layerId]);
}
