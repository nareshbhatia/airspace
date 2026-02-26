import MapboxDraw from '@mapbox/mapbox-gl-draw';

import { useControl } from './useControl';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export type MapboxDrawOptions = ConstructorParameters<typeof MapboxDraw>[0];

/**
 * Adds a Mapbox Draw control to the current map for interactive geometry editing.
 *
 * Wraps `useControl` to create and manage a `MapboxDraw` instance. The control
 * is added when the map is ready and removed on unmount.
 *
 * @param options - Optional `MapboxDraw` constructor options (modes, styles, controls, etc.).
 * @returns The `MapboxDraw` instance, or `null` if the map isn't ready yet.
 *
 * @example
 * ```ts
 * const draw = useDraw({ displayControlsDefault: false });
 *
 * useMapEvent('draw.create', (e) => {
 *   console.log('created', e);
 * });
 * ```
 */
export function useDraw(options?: MapboxDrawOptions): MapboxDraw | null {
  return useControl(() => new MapboxDraw(options ?? {}), {
    position: 'top-right',
  });
}
