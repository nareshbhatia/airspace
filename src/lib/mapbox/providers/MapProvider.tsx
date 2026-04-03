import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import mapboxgl, { Map as MapboxMap, type LngLatLike } from 'mapbox-gl';
import { useDebouncedCallback } from 'use-debounce';

import { MapContext, type MapContextValue } from './MapContext';
import { cn } from '../../../utils/cn';

import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function getInitialMapError(): string | undefined {
  return MAPBOX_TOKEN ? undefined : 'VITE_MAPBOX_TOKEN is not set';
}

/**
 * When `enabled`, ensures the `mapbox-dem` source exists and calls `setTerrain`.
 * When `enabled` is false, clears terrain. Idempotent.
 */
function applyTerrainToMap(map: MapboxMap, enabled: boolean): void {
  if (enabled) {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({
      source: 'mapbox-dem',
      exaggeration: 1.5,
    });
  } else {
    map.setTerrain(null);
  }
}

export interface MapProviderProps {
  style?: string;
  center?: LngLatLike;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  className?: string;
  onLoad?: (map: mapboxgl.Map) => void;
  /** Called when a runtime map error occurs (e.g. tile load failure). Use for logging/monitoring; does not replace the map. */
  onError?: (error: Error) => void;
  enableTerrain?: boolean;
  mapOptions?: Omit<
    mapboxgl.MapboxOptions,
    'container' | 'style' | 'center' | 'zoom' | 'pitch' | 'bearing'
  >;
  children?: React.ReactNode;
}

/**
 * Initializes a Mapbox GL map and provides it to descendant components via context.
 *
 * Renders a full-size map container, creates the `Map` instance on mount, and
 * exposes it through `MapContext` so child hooks (`useMap`, `useControl`,
 * `useMapLayer`, `useMapEvent`) can access it. The map is only exposed after
 * the `load` event (Mapbox best practice: add sources/layers only when style
 * is ready). Displays a fallback message when `VITE_MAPBOX_TOKEN` is missing,
 * map creation fails, or a runtime map error occurs.
 *
 * **Initial load (terrain):**
 * - Style `load` fires: attach `error`, `setMap`, consumer `onLoad` (scene sources/layers),
 *   then `applyTerrainToMap` synchronously, then `once('idle', …)` for a second apply.
 * - After React commits `map`: terrain `useEffect` runs—`applyTerrainToMap` if the style
 *   is already loaded, plus a `style.load` listener for full style reloads.
 * - First `idle`: `applyTerrainToMap` again (skipped if the style is not loaded).
 *
 * Reason: Mapbox Standard / Standard Satellite can run further style work after custom
 * layers are added. Relying only on the terrain `useEffect` (first run after `onLoad`
 * in a later commit) was observed to leave terrain unset until toggled. Applying at
 * the end of the `load` handler (after `onLoad`) and again on `idle` matches the stable
 * state and matches what a later toggle does.
 *
 * **Toggle terrain:**
 * - `enableTerrain` changes; the terrain `useEffect` re-runs and calls `applyTerrainToMap`.
 * - The one-time `load` / `idle` handlers registered at creation do not run again.
 *
 * @param style - Mapbox style URL (default: `'mapbox://styles/mapbox/standard'`).
 * @param center - Initial map center as `[lng, lat]`.
 * @param zoom - Initial zoom level (default: `12`).
 * @param pitch - Initial pitch in degrees (default: `0`).
 * @param bearing - Initial bearing in degrees (default: `0`).
 * @param className - Additional CSS classes for the map wrapper.
 * @param onLoad - Callback fired once the map has loaded. Does not need to be memoized (useEffectEvent keeps latest).
 * @param onError - Optional. Called when a runtime map error occurs (e.g. tile failure). Use for logging/monitoring. Does not need to be memoized.
 * @param enableTerrain - When `true`, adds a DEM source and enables terrain; when `false`, clears terrain.
 * @param mapOptions - Extra `MapboxOptions` forwarded to the constructor (container/style/camera props are excluded).
 * @param children - React nodes rendered on top of the map (controls, overlays, etc.).
 *
 * @example
 * ```tsx
 * <MapProvider center={[-122.4, 37.8]} zoom={10} enableTerrain>
 *   <FlightLayer />
 * </MapProvider>
 * ```
 */
export function MapProvider({
  style = 'mapbox://styles/mapbox/standard',
  center,
  zoom = 12,
  pitch = 0,
  bearing = 0,
  className,
  onLoad,
  onError,
  enableTerrain = false,
  mapOptions,
  children,
}: MapProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enableTerrainRef = useRef(enableTerrain);
  enableTerrainRef.current = enableTerrain;
  const [map, setMap] = useState<MapboxMap>();
  const [mapError, setMapError] = useState<string | undefined>(
    getInitialMapError,
  );
  const onLoadEvent = useEffectEvent((m: MapboxMap) => onLoad?.(m));
  const onErrorEvent = useEffectEvent((error: Error) => onError?.(error));

  const DEBOUNCE_MS = 200;
  const debouncedResize = useDebouncedCallback(
    () => map?.resize(),
    DEBOUNCE_MS,
  );

  const value = useMemo<MapContextValue>(() => ({ map }), [map]);

  // Create the map once on mount with initial props. We use an empty dependency array
  // on purpose: adding style, center, zoom, pitch, bearing, or mapOptions
  // would cause the effect to re-run and destroy/recreate the map whenever those
  // props change. We only want a single map instance with the initial configuration.
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    let mapInstance: MapboxMap | undefined;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      mapInstance = new MapboxMap({
        ...mapOptions,
        // Disable automatic map resize, we handle it manually in useEffect
        // This is to account for map resize during window resize + container
        // resize when the sidebar is open/closed.
        trackResize: false,
        container: containerRef.current,
        style,
        center,
        zoom,
        pitch,
        bearing,
      });

      mapInstance.on('load', () => {
        if (!mapInstance) return;
        const map = mapInstance;
        map.on('error', (e) => {
          onErrorEvent(e.error);
        });
        setMap(map);
        setMapError(undefined);
        onLoadEvent(map);
        // After consumer layers: apply here and on idle, not only in the terrain
        // useEffect, so Standard-style reconciliation after custom layers does not
        // leave terrain unset (see component JSDoc).
        applyTerrainToMap(map, enableTerrainRef.current);
        map.once('idle', () => {
          if (!map.isStyleLoaded()) return;
          applyTerrainToMap(map, enableTerrainRef.current);
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load map';
      setMapError(message);
    }

    return () => {
      mapInstance?.remove();
      setMap(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once with initial props
  }, []);

  // Terrain from props and when the style reloads (`style.load`).
  useEffect(() => {
    if (!map) return;

    const applyTerrain = () => {
      applyTerrainToMap(map, enableTerrain);
    };

    if (map.isStyleLoaded()) {
      applyTerrain();
    }

    map.on('style.load', applyTerrain);
    return () => {
      map.off('style.load', applyTerrain);
    };
  }, [map, enableTerrain]);

  // Handle map resize manually to account for window resize + container resize
  useEffect(() => {
    if (!map || !containerRef.current) return;
    const container = containerRef.current;

    const observer = new ResizeObserver(debouncedResize);
    observer.observe(container);

    return () => {
      debouncedResize.cancel();
      observer.disconnect();
    };
  }, [map, debouncedResize]);

  if (mapError) {
    return (
      <div
        className="w-full h-full min-h-0 bg-muted flex items-center justify-center text-muted-foreground p-6 text-center"
        role="alert"
      >
        <div>
          <p className="font-medium">Map unavailable</p>
          <p className="text-sm mt-1">{mapError}</p>
          <p className="text-xs mt-2">
            Set VITE_MAPBOX_TOKEN in .env to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapContext.Provider value={value}>
      <div className={cn('relative w-full h-full min-h-0', className)}>
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full min-h-0"
        />
        {children}
      </div>
    </MapContext.Provider>
  );
}
