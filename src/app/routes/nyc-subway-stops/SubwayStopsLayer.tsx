import { useEffect } from 'react';

import { useMap, useMapEvent, useMapLayer } from '../../../lib/mapbox';

import type { MapLayerSpec } from '../../../lib/mapbox';

const LAYER_ID = 'subway-stops-circle';
const HIGHLIGHT_LAYER_ID = 'subway-stops-highlight';

const layers: MapLayerSpec[] = [
  {
    id: LAYER_ID,
    type: 'circle',
    source: 'subway-stops',
    paint: {
      'circle-radius': 4,
      'circle-color': '#e11d48',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
    },
  },
  {
    id: HIGHLIGHT_LAYER_ID,
    type: 'circle',
    source: 'subway-stops',
    filter: ['==', ['get', 'cartodb_id'], -1],
    paint: {
      'circle-radius': 8,
      'circle-color': '#facc15',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  },
];

interface SubwayStopsLayerProps {
  data: GeoJSON.FeatureCollection | null;
  selectedStationId: number | null;
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
    if (!map || !map.getLayer(HIGHLIGHT_LAYER_ID)) return;
    const id = selectedStationId ?? -1;
    map.setFilter(HIGHLIGHT_LAYER_ID, ['==', ['get', 'cartodb_id'], id]);
  }, [map, selectedStationId]);

  useMapEvent('click', (e) => {
    const ev = e as { point?: { x: number; y: number } };
    if (ev.point && map) {
      const point: [number, number] = [ev.point.x, ev.point.y];
      const under = map.queryRenderedFeatures(point, {
        layers: [LAYER_ID],
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
    LAYER_ID,
  );

  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    LAYER_ID,
  );
  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    LAYER_ID,
  );

  return null;
}
