import { useEffect } from 'react';

import droneIconUrl from './assets/drone.svg?url';
import { dronesToFeatureCollection } from './utils/dronesToGeoJSON';
import { useMap, useMapLayer } from '../../../lib/mapbox';
import { useDroneStore } from '../../../stores/droneStore';

const DRONES_SOURCE_ID = 'drones';
const DRONE_SYMBOL_LAYER_ID = 'drones-symbols';
const DRONE_ICON_ID = 'drone-icon';
const ICON_SIZE = 64;

/**
 * Renders all drones as a Mapbox symbol layer. Subscribes to the drone store,
 * converts the Map to GeoJSON on each update, and calls setData so the layer
 * updates at 10 Hz without React re-renders. Uses a custom directional icon
 * rotated by each drone's heading.
 */
export function DroneLayer() {
  const { map } = useMap();
  const { setData } = useMapLayer(DRONES_SOURCE_ID, []);
  const drones = useDroneStore((state) => state.drones);

  // Sync store → GeoJSON source on every drones update (~10 Hz)
  useEffect(() => {
    setData(dronesToFeatureCollection(Array.from(drones.values())));
  }, [drones, setData]);

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

  return null;
}
