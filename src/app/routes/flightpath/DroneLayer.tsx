import { useEffect, useRef } from 'react';

import { dronesToFeatureCollection } from './utils/dronesToGeoJSON';
import droneIconUrl from '../../../assets/airplane.svg?url';
import { useDroneSelection } from '../../../hooks/useDroneSelection';
import { useDroneStoreApi } from '../../../hooks/useDroneStoreApi';
import { useMap, useMapEvent, useMapLayer } from '../../../lib/mapbox';

import type { DataDrivenPropertyValueSpecification } from 'mapbox-gl';

const DRONES_SOURCE_ID = 'drones';
const DRONE_SYMBOL_LAYER_ID = 'drones-symbols';
const DRONE_ICON_ID = 'drone-icon';
const ICON_SIZE = 24;

/** Selected drone: full opacity; others slightly dimmed (feature-state). */
const iconOpacityExpression: DataDrivenPropertyValueSpecification<number> = [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  1,
  0.8,
];

/**
 * Renders all drones as a Mapbox symbol layer. Syncs store → GeoJSON via
 * `useDroneStoreApi` subscribe (~10 Hz) so React does not re-render on every
 * telemetry tick. Selection uses `useDroneSelection`; feature-state updates
 * when selectedDroneId changes.
 */
export function DroneLayer() {
  const { map } = useMap();
  const { setData } = useMapLayer(DRONES_SOURCE_ID, [], {
    promoteId: 'droneId',
  });
  const storeApi = useDroneStoreApi();
  const { selectedDroneId, selectDrone } = useDroneSelection();
  const prevSelectedIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!storeApi) return;

    const syncGeoJson = () => {
      const { drones } = storeApi.getState();
      setData(dronesToFeatureCollection(Array.from(drones.values())));
    };

    syncGeoJson();
    return storeApi.subscribe((state) => state.drones, syncGeoJson);
  }, [storeApi, setData]);

  useEffect(() => {
    if (!map || !map.getLayer(DRONE_SYMBOL_LAYER_ID)) return;
    const prevId = prevSelectedIdRef.current;
    if (prevId != null) {
      try {
        map.removeFeatureState({ source: DRONES_SOURCE_ID, id: prevId });
      } catch {
        // ignore if source/feature changed
      }
    }
    prevSelectedIdRef.current = selectedDroneId;
    if (selectedDroneId != null) {
      try {
        map.setFeatureState(
          { source: DRONES_SOURCE_ID, id: selectedDroneId },
          { selected: true },
        );
      } catch {
        // ignore if source/feature not found
      }
    }
  }, [map, selectedDroneId]);

  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = ICON_SIZE;
        canvas.height = ICON_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE);
        const imageData = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);

        map.addImage(DRONE_ICON_ID, {
          width: ICON_SIZE,
          height: ICON_SIZE,
          data: imageData.data,
        });

        if (!map.getLayer(DRONE_SYMBOL_LAYER_ID)) {
          map.addLayer({
            id: DRONE_SYMBOL_LAYER_ID,
            type: 'symbol',
            source: DRONES_SOURCE_ID,
            layout: {
              'icon-image': DRONE_ICON_ID,
              'icon-size': 0.5,
              'icon-rotate': ['get', 'heading'],
              'icon-allow-overlap': true,
            },
            paint: {
              'icon-opacity': iconOpacityExpression,
            },
          });
        }
      } catch {
        // ignore if already added or style changed
      }
    };
    img.onerror = () => {
      console.error('Failed to load drone icon');
    };
    img.src = droneIconUrl;

    return () => {
      cancelled = true;
      try {
        if (map.getLayer(DRONE_SYMBOL_LAYER_ID)) {
          map.removeLayer(DRONE_SYMBOL_LAYER_ID);
        }
        map.removeImage(DRONE_ICON_ID);
      } catch {
        // ignore if style changed or not added
      }
    };
  }, [map]);

  useMapEvent(
    'click',
    (e: unknown) => {
      const ev = e as {
        features?: Array<{ properties?: { droneId?: string } }>;
      };
      const features = ev.features;
      if (features?.length) {
        const droneId = features[0].properties?.droneId;
        if (typeof droneId === 'string') {
          selectDrone(droneId);
        }
      }
    },
    DRONE_SYMBOL_LAYER_ID,
  );

  useMapEvent('click', (e: unknown) => {
    if (!map) return;
    const ev = e as { point?: { x: number; y: number } };
    const point = ev.point;
    if (!point) return;
    const features = map.queryRenderedFeatures([point.x, point.y], {
      layers: [DRONE_SYMBOL_LAYER_ID],
    });
    if (features.length === 0) {
      selectDrone(undefined);
    }
  });

  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    DRONE_SYMBOL_LAYER_ID,
  );
  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    DRONE_SYMBOL_LAYER_ID,
  );

  return null;
}
