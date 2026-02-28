import { useEffect } from 'react';

import { useMap, useMapEvent, useMapLayer } from '../../../lib/mapbox';

import type { MapLayerSpec } from '../../../lib/mapbox';

const STOPS_LAYER_ID = 'subway-stops-circle';
const STOPS_HIGHLIGHT_LAYER_ID = 'subway-stops-highlight';
const STOPS_LABELS_LAYER_ID = 'subway-stops-labels';

const layers: MapLayerSpec[] = [
  // Red circles for each station with white stroke for contrast
  // Visible from zoom 11, fade-in 11→12.
  {
    id: STOPS_LAYER_ID,
    type: 'circle',
    source: 'subway-stops',
    minzoom: 11,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 5],
      'circle-color': '#e11d48',
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 1],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0,
        12,
        1,
      ],
    },
  },
  // Larger yellow circle for the selected station; filter set at runtime.
  {
    id: STOPS_HIGHLIGHT_LAYER_ID,
    type: 'circle',
    source: 'subway-stops',
    minzoom: 11,
    filter: ['==', ['get', 'cartodb_id'], -1],
    paint: {
      'circle-radius': 8,
      'circle-color': '#facc15',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  },
  // Station name labels; visible from zoom 13, fade-in 13→14.
  {
    id: STOPS_LABELS_LAYER_ID,
    type: 'symbol',
    source: 'subway-stops',
    minzoom: 13,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 14,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
      'text-translate': [1, 20],
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 1],
    },
  },
];

interface SubwayStopsLayerProps {
  data: GeoJSON.FeatureCollection | undefined;
  selectedStationId: number | undefined;
  onStationClick: (id: number) => void;
  onDeselect: () => void;
}

export function SubwayStopsLayer({
  data,
  selectedStationId,
  onStationClick,
  onDeselect,
}: SubwayStopsLayerProps) {
  const { map } = useMap();
  const { setData } = useMapLayer('subway-stops', layers);

  useEffect(() => {
    if (data) setData(data);
  }, [data, setData]);

  useEffect(() => {
    if (!map || !map.getLayer(STOPS_HIGHLIGHT_LAYER_ID)) return;
    const id = selectedStationId ?? -1;
    map.setFilter(STOPS_HIGHLIGHT_LAYER_ID, ['==', ['get', 'cartodb_id'], id]);
  }, [map, selectedStationId]);

  useMapEvent('click', (e) => {
    const ev = e as { point?: { x: number; y: number } };
    if (ev.point && map) {
      const point: [number, number] = [ev.point.x, ev.point.y];
      const under = map.queryRenderedFeatures(point, {
        layers: [STOPS_LAYER_ID],
      });
      if (under.length === 0) onDeselect();
    }
  });

  useMapEvent(
    'click',
    (e) => {
      const ev = e as {
        features?: Array<{ properties?: Record<string, unknown> }>;
      };
      const features = ev.features;
      if (features?.length) {
        const id = Number(features[0].properties?.cartodb_id);
        if (!Number.isNaN(id)) onStationClick(id);
      }
    },
    STOPS_LAYER_ID,
  );

  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    STOPS_LAYER_ID,
  );

  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    STOPS_LAYER_ID,
  );

  return null;
}
