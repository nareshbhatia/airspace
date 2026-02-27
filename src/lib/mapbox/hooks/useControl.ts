import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useSyncExternalStore,
} from 'react';

import { useMap } from './useMap';

import type { IControl, ControlPosition } from 'mapbox-gl';

export interface UseControlOptions {
  position?: ControlPosition;
}

/**
 * Manages the lifecycle of a Mapbox GL `IControl` on the current map.
 *
 * The control is created via `factory`, added when the map is ready,
 * and automatically removed on unmount or when the map/position changes.
 *
 * @param factory - Returns a new control instance. Does not need to be memoized (useEffectEvent keeps latest).
 * @param options.position - Map corner to place the control (default: `'top-right'`).
 * @returns The live control instance, or `null` if the map isn't ready yet.
 *
 * @example
 * ```ts
 * const nav = useControl(() => new NavigationControl(), {
 *   position: 'bottom-right',
 * });
 * ```
 */
export function useControl<T extends IControl>(
  factory: () => T,
  options?: UseControlOptions,
): T | null {
  const { map } = useMap();
  const controlRef = useRef<T | null>(null);
  const createControl = useEffectEvent(factory);
  const listenersRef = useRef(new Set<() => void>());
  const position = options?.position ?? 'top-right';

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => controlRef.current, []);

  useEffect(() => {
    const listeners = listenersRef.current;

    if (!map) {
      controlRef.current = null;
      listeners.forEach((l) => l());
      return;
    }

    const instance = createControl();
    controlRef.current = instance;
    map.addControl(instance, position);
    listeners.forEach((l) => l());

    return () => {
      try {
        if (controlRef.current && map.hasControl(controlRef.current)) {
          map.removeControl(controlRef.current);
        }
      } catch {
        // ignore if map/style changed
      }
      controlRef.current = null;
      listeners.forEach((l) => l());
    };
  }, [map, position]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
