import { useEffect } from 'react';

// Vite: import SVG as URL for map.loadImage
import airplaneIconUrl from './assets/airplane.svg?url';
import { aircraftToFeatureCollection } from './utils/aircraftToGeoJSON';
import { useMap, useMapLayer, useMapEvent } from '../../../lib/mapbox';

import type { Aircraft } from './types';
import type { MapLayerSpec } from '../../../lib/mapbox';

const AIRCRAFT_SOURCE_ID = 'aircraft';
const AIRCRAFT_CLUSTERS_LAYER_ID = 'aircraft-clusters';
const AIRCRAFT_CLUSTER_COUNT_LAYER_ID = 'aircraft-cluster-count';
const AIRCRAFT_SYMBOLS_LAYER_ID = 'aircraft-symbols';
const AIRCRAFT_ICON_ID = 'aircraft-icon';

const CLUSTER_MAX_ZOOM = 14; // above this zoom, no clustering
const CLUSTER_RADIUS = 50; // pixels; points within this radius form a cluster
const FLY_TO_QUERY_BOX_MARGIN = 15; // pixels; query this margin around projected point for symbol hit-test

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
  id: AIRCRAFT_CLUSTER_COUNT_LAYER_ID,
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
  id: AIRCRAFT_SYMBOLS_LAYER_ID,
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

/** Layer specs for the aircraft cluster layer. */
const AIRCRAFT_CLUSTER_LAYER_SPECS: MapLayerSpec[] = [
  clusterCircleLayer,
  clusterCountLayer,
];

/** Layer spec for the aircraft symbol layer. */
const AIRCRAFT_SYMBOL_LAYER_SPEC: MapLayerSpec = aircraftSymbolLayer;

interface AircraftLayerProps {
  aircraft: Aircraft[];
  selectedAircraftId?: string;
  onAircraftSelect: (icao24: string | undefined) => void;
}

/**
 * Renders aircraft as a Mapbox symbol layer with a custom airplane icon
 * rotated to each aircraft's heading.
 *
 * Clustering (source-level, CLUSTER_MAX_ZOOM=14, CLUSTER_RADIUS=50px):
 * - At zoom <= 14: points within 50px of each other are grouped into
 *   clusters (circle + count label). Points with no neighbors in that
 *   radius stay unclustered and are drawn as individual plane icons.
 * - At zoom >= 15: clustering is off; every aircraft is shown as an icon.
 *
 * So at low zoom levels you can see both clusters and isolated planes.
 *
 * Clicking a cluster circle zooms the map to the expansion zoom so the
 * cluster breaks into smaller clusters or individual aircraft.
 *
 * Clicking a plane icon selects it (sidebar sync).
 * Clicking the map background deselects.
 */
function AircraftLayer({
  aircraft,
  selectedAircraftId,
  onAircraftSelect,
}: AircraftLayerProps) {
  const { map } = useMap();
  const { setData } = useMapLayer(
    AIRCRAFT_SOURCE_ID,
    AIRCRAFT_CLUSTER_LAYER_SPECS,
    aircraftSourceOptions,
  );

  // Fly to selected aircraft only when it is off-screen or in a cluster. Run after map is idle so
  // bounds and queryRenderedFeatures see the latest paint (avoids false positives from stale map state).
  useEffect(() => {
    if (!map || !selectedAircraftId) return;
    const selectedAircraft = aircraft.find(
      (a) => a.icao24 === selectedAircraftId,
    );
    if (!selectedAircraft) return;

    const lng = selectedAircraft.longitude;
    const lat = selectedAircraft.latitude;

    // Handle the map being idle
    const handleIdle = () => {
      const bounds = map.getBounds();

      // If the aircraft is off-screen, fly to it
      if (!bounds?.contains([lng, lat])) {
        map.flyTo({
          center: [lng, lat],
          zoom: CLUSTER_MAX_ZOOM + 1,
          duration: 500,
        });
        return;
      }

      // Is the aircraft visible as an individual icon?
      const point = map.project([lng, lat]);
      const margin = FLY_TO_QUERY_BOX_MARGIN;
      const features = map.queryRenderedFeatures(
        [
          [point.x - margin, point.y - margin],
          [point.x + margin, point.y + margin],
        ],
        { layers: [AIRCRAFT_SYMBOLS_LAYER_ID] },
      );
      const isVisibleAsIcon = features.some(
        (f) => f.properties?.icao24 === selectedAircraftId,
      );
      if (!isVisibleAsIcon) {
        map.flyTo({
          center: [lng, lat],
          zoom: CLUSTER_MAX_ZOOM + 1,
          duration: 500,
        });
      }
    };

    // Handle the map being idle
    map.once('idle', handleIdle);

    return () => {
      map.off('idle', handleIdle);
    };
  }, [aircraft, selectedAircraftId, map]);

  // Update the source data when the aircraft array changes
  useEffect(() => {
    setData(aircraftToFeatureCollection(aircraft));
  }, [aircraft, setData]);

  // Data-driven icon size: selected aircraft slightly larger (0.7)
  // When selectedAircraftId is undefined we pass '' so no feature matches and all stay 0.5
  useEffect(() => {
    if (!map || !map.getLayer(AIRCRAFT_SYMBOLS_LAYER_ID)) return;
    map.setLayoutProperty(AIRCRAFT_SYMBOLS_LAYER_ID, 'icon-size', [
      'case',
      ['==', ['get', 'icao24'], ['literal', selectedAircraftId ?? '']],
      0.7,
      0.5,
    ]);
  }, [map, selectedAircraftId]);

  // Load the aircraft icon, then add the symbol layer (Mapbox needs the image in style before the layer is added)
  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    // Initialize the aircraft icon image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const size = 64;

    // Initialize the on load handler
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

        // Add the aircraft icon to the map
        map.addImage(AIRCRAFT_ICON_ID, {
          width: size,
          height: size,
          data: imageData.data,
        });

        // Now add the symbol layer
        if (!map.getLayer(AIRCRAFT_SYMBOLS_LAYER_ID)) {
          const { beforeId, ...layerConfig } = AIRCRAFT_SYMBOL_LAYER_SPEC;
          map.addLayer(
            layerConfig as Parameters<import('mapbox-gl').Map['addLayer']>[0],
            beforeId,
          );
        }
      } catch {
        // ignore if already added or style changed
      }
    };

    // Initialize the on error handler
    img.onerror = () => {
      console.error('Failed to load aircraft icon');
    };

    // Set the aircraft icon image source - this will trigger image loading
    img.src = airplaneIconUrl;

    // Cleanup on unmount
    return () => {
      cancelled = true;
      try {
        if (map.getLayer(AIRCRAFT_SYMBOLS_LAYER_ID)) {
          map.removeLayer(AIRCRAFT_SYMBOLS_LAYER_ID);
        }
        map.removeImage(AIRCRAFT_ICON_ID);
      } catch {
        // ignore if style changed or not added
      }
    };
  }, [map]);

  // Handle click in the clusters layer to expand a cluster
  useMapEvent(
    'click',
    (e) => {
      if (!map) return;
      const ev = e as { point?: { x: number; y: number } };
      const point = ev.point;
      if (!point) return;

      // Query the rendered features at the click point in the clusters layer
      const features = map.queryRenderedFeatures([point.x, point.y], {
        layers: [AIRCRAFT_CLUSTERS_LAYER_ID],
      });
      if (features.length === 0) return;

      // Get the cluster id of the clicked feature
      const feature = features[0];
      const clusterId =
        feature.properties?.cluster_id ?? (feature as { id?: number }).id;
      if (clusterId == null) return;

      // Get the geometry of the clicked feature
      const geometry = feature.geometry;
      if (geometry.type !== 'Point') return;

      // Get the source of the aircraft layer
      const source = map.getSource(AIRCRAFT_SOURCE_ID);
      if (!source || !('getClusterExpansionZoom' in source)) return;

      // Get the cluster expansion zoom for the clicked cluster
      (
        source as {
          getClusterExpansionZoom: (
            id: number,
            cb: (err: unknown, zoom?: number) => void,
          ) => void;
        }
      ).getClusterExpansionZoom(Number(clusterId), (err, zoom) => {
        if (err || zoom == null) return;

        // Fly to the clicked cluster
        map.flyTo({
          center: geometry.coordinates as [number, number],
          zoom,
          duration: 500,
        });
      });
    },
    AIRCRAFT_CLUSTERS_LAYER_ID,
  );

  // Handle click in the symbols layer to select an aircraft
  useMapEvent(
    'click',
    (e) => {
      if (!map) return;
      const ev = e as { point?: { x: number; y: number } };
      const point = ev.point;
      if (!point) return;

      // Query the rendered features at the click point in the symbols layer
      const features = map.queryRenderedFeatures([point.x, point.y], {
        layers: [AIRCRAFT_SYMBOLS_LAYER_ID],
      });
      if (features.length === 0) return;

      // Get the aircraft id of the clicked feature
      const feature = features[0];
      const icao24 = feature.properties?.icao24;

      // Select the aircraft
      if (typeof icao24 === 'string') onAircraftSelect(icao24);
    },
    AIRCRAFT_SYMBOLS_LAYER_ID,
  );

  // Handle click in any of the aircraft layers to deselect
  useMapEvent('click', (e) => {
    if (!map) return;
    const ev = e as { point?: { x: number; y: number } };
    const point = ev.point;
    if (!point) return;

    // Query the rendered features at the click point in the clusters, cluster count, and symbols layers
    const features = map.queryRenderedFeatures([point.x, point.y], {
      layers: [
        AIRCRAFT_CLUSTERS_LAYER_ID,
        AIRCRAFT_CLUSTER_COUNT_LAYER_ID,
        AIRCRAFT_SYMBOLS_LAYER_ID,
      ],
    });
    if (features.length === 0) onAircraftSelect(undefined);
  });

  // Handle mouse enter in the clusters layer to show pointer
  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    AIRCRAFT_CLUSTERS_LAYER_ID,
  );

  // Handle mouse leave in the clusters layer to show default cursor
  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    AIRCRAFT_CLUSTERS_LAYER_ID,
  );

  // Handle mouse enter in the symbols layer to show pointer
  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    AIRCRAFT_SYMBOLS_LAYER_ID,
  );

  // Handle mouse leave in the symbols layer to show default cursor
  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    AIRCRAFT_SYMBOLS_LAYER_ID,
  );

  return null;
}

export { AircraftLayer };
