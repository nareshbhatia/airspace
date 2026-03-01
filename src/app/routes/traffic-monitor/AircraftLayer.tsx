import { useEffect } from 'react';

// Vite: import SVG as URL for map.loadImage
import airplaneIconUrl from './assets/airplane.svg?url';
import { aircraftToFeatureCollection } from './utils/aircraftToGeoJSON';
import { useMap, useMapLayer } from '../../../lib/mapbox';

import type { Aircraft } from './types';
import type { MapLayerSpec } from '../../../lib/mapbox';

const AIRCRAFT_ICON_ID = 'aircraft-icon';

const aircraftSymbolLayer: MapLayerSpec = {
  id: 'aircraft-symbols',
  type: 'symbol',
  source: 'aircraft',
  layout: {
    'icon-image': AIRCRAFT_ICON_ID,
    'icon-size': 0.5,
    'icon-rotate': ['get', 'headingDeg'],
    'icon-allow-overlap': false,
    'icon-ignore-placement': false,
  },
};

interface AircraftLayerProps {
  aircraft: Aircraft[];
}

/**
 * Renders aircraft as a Mapbox symbol layer with a custom airplane icon
 * rotated to each aircraft's heading. Uses useMapLayer and setData for
 * dynamic GeoJSON updates.
 */
function AircraftLayer({ aircraft }: AircraftLayerProps) {
  const { map } = useMap();
  const { setData } = useMapLayer('aircraft', [aircraftSymbolLayer]);

  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    const size = 64;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        map.addImage(AIRCRAFT_ICON_ID, {
          width: size,
          height: size,
          data: imageData.data,
        });
      } catch {
        // ignore if already added or style changed
      }
    };
    img.onerror = () => {
      console.error('Failed to load aircraft icon');
    };
    img.src = airplaneIconUrl;
    return () => {
      cancelled = true;
      try {
        map.removeImage(AIRCRAFT_ICON_ID);
      } catch {
        // ignore if style changed or image not added
      }
    };
  }, [map]);

  useEffect(() => {
    setData(aircraftToFeatureCollection(aircraft));
  }, [aircraft, setData]);

  return null;
}

export { AircraftLayer };
