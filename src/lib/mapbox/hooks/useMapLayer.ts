import { useCallback, useEffect, useRef } from 'react';

import { useMap } from './useMap';

import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';

/** Mapbox GL layer definition. Follows the style spec (paint, layout, etc.). */
export interface MapLayerSpec {
  id: string;
  type: string;
  source: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown;
  minzoom?: number;
  maxzoom?: number;
  /** Optional layer id to insert this layer before (controls draw order). */
  beforeId?: string;
  [key: string]: unknown;
}

export interface UseMapLayerReturn {
  setData: (data: GeoJSON.FeatureCollection) => void;
}

/**
 * Manages a GeoJSON source and its associated layers on the current map.
 *
 * Creates the source (if it doesn't already exist) and adds the given layers
 * when the map is ready (after style load). Layers are applied once; use
 * `beforeId` on a layer spec to control draw order relative to existing layers.
 * Both source and layers are removed on unmount or when `sourceId` changes.
 * Returns a `setData` function for updating the source's GeoJSON data at any time.
 *
 * @param sourceId - Unique id for the GeoJSON source.
 * @param layers - Layer specs to add on top of the source. Use `beforeId` for layer order. Does not need to be memoized.
 * @returns `{ setData }` — call with a `FeatureCollection` to update the source data.
 *
 * @example
 * ```ts
 * const { setData } = useMapLayer('flights', [
 *   { id: 'flights-line', type: 'line', source: 'flights', paint: { 'line-color': '#0ea5e9' } },
 * ]);
 *
 * useEffect(() => {
 *   setData(flightFeatures);
 * }, [flightFeatures, setData]);
 * ```
 */
export function useMapLayer(
  sourceId: string,
  layers: MapLayerSpec[],
): UseMapLayerReturn {
  const { map } = useMap();
  const layersRef = useRef<MapLayerSpec[]>(layers);
  useEffect(() => {
    layersRef.current = layers;
  });

  const setData = useCallback(
    (data: GeoJSON.FeatureCollection) => {
      if (!map) return;
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (!source) return;
      source.setData(data);
    },
    [sourceId, map],
  );

  useEffect(() => {
    if (!map) return;
    const layerSpecs = layersRef.current;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    for (const layer of layerSpecs) {
      if (!map.getLayer(layer.id)) {
        const { beforeId, ...layerConfig } = layer;
        map.addLayer(
          layerConfig as Parameters<MapboxMap['addLayer']>[0],
          beforeId,
        );
      }
    }

    return () => {
      try {
        for (let i = layerSpecs.length - 1; i >= 0; i--) {
          const layer = layerSpecs[i];
          if (layer && map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch {
        // ignore if style changed
      }
    };
  }, [map, sourceId]);

  return { setData };
}
