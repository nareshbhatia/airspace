import { useEffect, useRef } from 'react';

import { dronesToFeatureCollection } from './utils/dronesToGeoJSON';
import droneIconUrl from '../../../assets/airplane.svg?url';
import { useMap, useMapEvent, useMapLayer } from '../../../lib/mapbox';
import { useDroneStore } from '../../../stores/droneStore';

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
 * Renders all drones as a Mapbox symbol layer. Subscribes to the drone store,
 * converts the Map to GeoJSON on each update, and calls setData so the layer
 * updates at 10 Hz without React re-renders. Uses a custom directional icon
 * rotated by each drone's heading. Click on a marker selects the drone;
 * click on map background deselects. Selection is reflected via feature-state.
 */
export function DroneLayer() {
  const { map } = useMap();
  const { setData } = useMapLayer(DRONES_SOURCE_ID, [], {
    promoteId: 'droneId',
  });
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const prevSelectedIdRef = useRef<string | undefined>(undefined);

  // Sync store → GeoJSON source on every drones update (~10 Hz)
  useEffect(() => {
    setData(dronesToFeatureCollection(Array.from(drones.values())));
  }, [drones, setData]);

  // Sync Mapbox feature-state with selectedDroneId (selected marker gets full opacity)
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

  // Load drone icon and add symbol layer (Mapbox requires image in style before layer)
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

  // Click on drone marker → select that drone
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

  // Click on map background → deselect
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

  // Pointer cursor when hovering over drone markers
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
