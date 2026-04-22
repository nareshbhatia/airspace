import { useEffect } from 'react';

import {
  airspaceRouteToFeatureCollection,
  EMPTY_ROUTE_FEATURE_COLLECTION,
} from './airspaceRouteToFeatureCollection';
import { useMapLayer } from '../../../lib/mapbox';

import type { AirspaceRoute, MapLayerSpec } from '../../../lib/mapbox';

const MAPBOX_ROUTE_SOURCE_ID = 'mapbox-route';
const MAPBOX_ROUTE_LINE_LAYER_ID = 'mapbox-route-line';
const ROUTE_COLOR = '#1d4ed8';

const layers: MapLayerSpec[] = [
  {
    id: MAPBOX_ROUTE_LINE_LAYER_ID,
    type: 'line',
    source: MAPBOX_ROUTE_SOURCE_ID,
    layout: {
      'line-elevation-reference': 'ground',
      'line-z-offset': [
        'at-interpolated',
        ['*', ['line-progress'], ['-', ['length', ['get', 'elevation']], 1]],
        ['get', 'elevation'],
      ],
    },
    paint: {
      'line-color': ROUTE_COLOR,
      'line-emissive-strength': 1,
      'line-width': ['interpolate', ['linear'], ['zoom'], 15, 5, 20, 10],
    },
  },
];

interface MapboxRouteLayerProps {
  route: AirspaceRoute | undefined;
}

export function MapboxRouteLayer({ route }: MapboxRouteLayerProps) {
  const { setData } = useMapLayer(MAPBOX_ROUTE_SOURCE_ID, layers, {
    lineMetrics: true,
  });

  useEffect(() => {
    if (!route) {
      setData(EMPTY_ROUTE_FEATURE_COLLECTION);
      return;
    }
    setData(airspaceRouteToFeatureCollection(route));
  }, [route, setData]);

  return null;
}
