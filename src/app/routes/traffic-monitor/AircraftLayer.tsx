import { useEffect } from 'react';

// Vite: import SVG as URL for map.loadImage
import airplaneIconUrl from './assets/airplane.svg?url';
import { aircraftToFeatureCollection } from './utils/aircraftToGeoJSON';
import { useMap, useMapLayer, useMapEvent } from '../../../lib/mapbox';

import type { Aircraft } from './types';
import type { MapLayerSpec } from '../../../lib/mapbox';

const AIRCRAFT_ICON_ID = 'aircraft-icon';
const AIRCRAFT_SOURCE_ID = 'aircraft';
const AIRCRAFT_CLUSTERS_LAYER_ID = 'aircraft-clusters';
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 50;

const clusterCircleLayer: MapLayerSpec = {
  id: AIRCRAFT_CLUSTERS_LAYER_ID,
  type: 'circle',
  source: AIRCRAFT_SOURCE_ID,
  filter: ['has', 'point_count'],
  paint: {
    'circle-radius': ['step', ['get', 'point_count'], 12, 10, 18, 50, 24],
    'circle-color': '#D97706',
  },
};

const clusterCountLayer: MapLayerSpec = {
  id: 'aircraft-cluster-count',
  type: 'symbol',
  source: AIRCRAFT_SOURCE_ID,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-size': 12,
    // Mapbox symbol text uses fonts from the style's glyphs, not app CSS; these are provided by the map style
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  },
  paint: {
    'text-color': '#ffffff',
  },
};

const aircraftSymbolLayer: MapLayerSpec = {
  id: 'aircraft-symbols',
  type: 'symbol',
  source: AIRCRAFT_SOURCE_ID,
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': AIRCRAFT_ICON_ID,
    'icon-size': 0.5,
    'icon-rotate': ['get', 'headingDeg'],
    // Allow icon overlap to show accurate count of unclustered aircraft
    'icon-allow-overlap': true,
    'icon-ignore-placement': false,
  },
};

const aircraftSourceOptions = {
  cluster: true,
  clusterMaxZoom: CLUSTER_MAX_ZOOM,
  clusterRadius: CLUSTER_RADIUS,
};

const AIRCRAFT_LAYERS: MapLayerSpec[] = [
  clusterCircleLayer,
  clusterCountLayer,
  aircraftSymbolLayer,
];

interface AircraftLayerProps {
  aircraft: Aircraft[];
}

/**
 * Renders aircraft as a Mapbox symbol layer with a custom airplane icon
 * rotated to each aircraft's heading. Uses source-level clustering at low
 * zoom (cluster circles + count labels) and unclustered symbols above
 * clusterMaxZoom. Clicking a cluster zooms to expand it.
 */
function AircraftLayer({ aircraft }: AircraftLayerProps) {
  const { map } = useMap();
  const { setData } = useMapLayer(
    AIRCRAFT_SOURCE_ID,
    AIRCRAFT_LAYERS,
    aircraftSourceOptions,
  );

  // Update the source data when the aircraft array changes
  useEffect(() => {
    setData(aircraftToFeatureCollection(aircraft));
  }, [aircraft, setData]);

  // Load the aircraft icon image
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

  // Handle cluster click to expand
  useMapEvent(
    'click',
    (e) => {
      if (!map) return;
      const ev = e as { point?: { x: number; y: number } };
      const point = ev.point;
      if (!point) return;
      const features = map.queryRenderedFeatures([point.x, point.y], {
        layers: [AIRCRAFT_CLUSTERS_LAYER_ID],
      });
      if (features.length === 0) return;
      const feature = features[0];
      const clusterId =
        feature.properties?.cluster_id ?? (feature as { id?: number }).id;
      if (clusterId == null) return;
      const geometry = feature.geometry;
      if (geometry.type !== 'Point') return;
      const source = map.getSource(AIRCRAFT_SOURCE_ID);
      if (!source || !('getClusterExpansionZoom' in source)) return;
      (
        source as {
          getClusterExpansionZoom: (
            id: number,
            cb: (err: unknown, zoom?: number) => void,
          ) => void;
        }
      ).getClusterExpansionZoom(Number(clusterId), (err, zoom) => {
        if (err || zoom == null) return;
        map.flyTo({
          center: geometry.coordinates as [number, number],
          zoom,
          duration: 500,
        });
      });
    },
    AIRCRAFT_CLUSTERS_LAYER_ID,
  );

  // Handle mouse enter to show pointer
  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    AIRCRAFT_CLUSTERS_LAYER_ID,
  );

  // Handle mouse leave to show default cursor
  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    AIRCRAFT_CLUSTERS_LAYER_ID,
  );

  return null;
}

export { AircraftLayer };
