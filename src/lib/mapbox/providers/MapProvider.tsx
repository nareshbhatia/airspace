import { useEffect, useMemo, useRef, useState } from 'react';

import mapboxgl, { Map as MapboxMap, type LngLatLike } from 'mapbox-gl';

import { MapContext } from './MapContext';
import { cn } from '../../../utils/cn';

import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function getInitialMapError(): string | null {
  return MAPBOX_TOKEN ? null : 'VITE_MAPBOX_TOKEN is not set';
}

interface MapProviderProps {
  style?: string;
  center?: LngLatLike;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  className?: string;
  onLoad?: (map: mapboxgl.Map) => void;
  /** Called when a runtime map error occurs (e.g. tile load failure). Use for logging/monitoring; does not replace the map. */
  onError?: (error: Error) => void;
  enable3D?: boolean;
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
 * @param style - Mapbox style URL (default: `'mapbox://styles/mapbox/outdoors-v12'`).
 * @param center - Initial map center as `[lng, lat]`.
 * @param zoom - Initial zoom level (default: `12`).
 * @param pitch - Initial pitch in degrees (default: `0`).
 * @param bearing - Initial bearing in degrees (default: `0`).
 * @param className - Additional CSS classes for the map wrapper.
 * @param onLoad - Callback fired once the map has loaded. Does not need to be memoized.
 * @param onError - Optional. Called when a runtime map error occurs (e.g. tile failure). Use for logging/monitoring.
 * @param enable3D - When `true`, adds a DEM source and enables 3-D terrain.
 * @param mapOptions - Extra `MapboxOptions` forwarded to the constructor (container/style/camera props are excluded).
 * @param children - React nodes rendered on top of the map (controls, overlays, etc.).
 *
 * @example
 * ```tsx
 * <MapProvider center={[-122.4, 37.8]} zoom={10} enable3D>
 *   <FlightLayer />
 * </MapProvider>
 * ```
 */
export function MapProvider({
  style = 'mapbox://styles/mapbox/outdoors-v12',
  center,
  zoom = 12,
  pitch = 0,
  bearing = 0,
  className,
  onLoad,
  onError,
  enable3D = false,
  mapOptions,
  children,
}: MapProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(getInitialMapError);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  const value = useMemo(() => ({ map }), [map]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    let mapInstance: MapboxMap | null = null;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      mapInstance = new MapboxMap({
        ...mapOptions,
        container: containerRef.current,
        style,
        center,
        zoom,
        pitch,
        bearing,
      });

      mapInstance.on('load', () => {
        if (!mapInstance) return;
        if (enable3D) {
          if (!mapInstance.getSource('mapbox-dem')) {
            mapInstance.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14,
            });
          }
          mapInstance.setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1.5,
          });
        }
        mapInstance.on('error', (e) => {
          onErrorRef.current?.(e.error);
        });
        setMap(mapInstance);
        setMapError(null);
        onLoadRef.current?.(mapInstance);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load map';
      setMapError(message);
    }

    return () => {
      mapInstance?.remove();
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once with initial props
  }, []);

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
