import { useEffect } from 'react';

import { useMapLayer } from '../../../lib/mapbox';

import type { MapLayerSpec } from '../../../lib/mapbox';

/** NYC subway route colors by rt_symbol (MTA-style). */
const ROUTE_COLORS: Record<string, string> = {
  '1': '#ee352e',
  '4': '#00933c',
  '7': '#b933ad',
  A: '#0039a6',
  SI: '#0039a6',
  B: '#ff6319',
  G: '#6cbe45',
  J: '#996633',
  L: '#a7a9ac',
  N: '#fccc0a',
};

const DEFAULT_ROUTE_COLOR = '#808080';

/** Mapbox match expression: line-color by rt_symbol. */
const lineColorExpression: unknown[] = [
  'match',
  ['get', 'rt_symbol'],
  ...Object.entries(ROUTE_COLORS).flat(),
  DEFAULT_ROUTE_COLOR,
];

const ROUTES_LAYER_ID = 'subway-routes-lines';

const layers: MapLayerSpec[] = [
  // Subway route lines colored by rt_symbol (MTA-style)
  // Line width grows with zoom (2→5 from zoom 10→15).
  {
    id: ROUTES_LAYER_ID,
    type: 'line',
    source: 'subway-routes',
    paint: {
      'line-color': lineColorExpression,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 5],
    },
  },
];

interface SubwayRoutesLayerProps {
  data: GeoJSON.FeatureCollection | undefined;
}

export function SubwayRoutesLayer({ data }: SubwayRoutesLayerProps) {
  const { setData } = useMapLayer('subway-routes', layers);

  useEffect(() => {
    if (data) setData(data);
  }, [data, setData]);

  return null;
}
