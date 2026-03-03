import { useEffect } from 'react';

import { zonesToFeatureCollection } from './utils/zonesToFeatureCollection';
import { useMapLayer } from '../../../lib/mapbox';

import type { DrawnZone } from './types';
import type { MapLayerSpec } from '../../../lib/mapbox';

const SOURCE_ID = 'zone-editor-zones';

/** Colors per README: Mission Boundary = Blue, No-Fly Zone = Red, Restricted Airspace = Amber, untyped = neutral gray. */
const COLOR_MISSION_BOUNDARY = '#2563eb';
const COLOR_NO_FLY_ZONE = '#dc2626';
const COLOR_RESTRICTED_AIRSPACE = '#f59e0b';
const COLOR_UNTYPED = '#6b7280';

/** Data-driven fill color from feature.properties.type */
const fillColorExpression: unknown[] = [
  'match',
  ['get', 'type'],
  'mission-boundary',
  COLOR_MISSION_BOUNDARY,
  'no-fly-zone',
  COLOR_NO_FLY_ZONE,
  'restricted-airspace',
  COLOR_RESTRICTED_AIRSPACE,
  COLOR_UNTYPED,
];

const layers: MapLayerSpec[] = [
  {
    id: 'zone-editor-zones-fill',
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-color': fillColorExpression,
      'fill-opacity': 0.25,
    },
  },
  {
    id: 'zone-editor-zones-line',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': fillColorExpression,
      'line-width': 2,
    },
  },
];

interface ZoneEditorZonesLayerProps {
  zones: DrawnZone[];
}

/**
 * Renders committed zones as a Mapbox GeoJSON layer with fill and stroke.
 * Color is driven by the zone type via a match expression.
 */
export function ZoneEditorZonesLayer({ zones }: ZoneEditorZonesLayerProps) {
  const { setData } = useMapLayer(SOURCE_ID, layers);

  useEffect(() => {
    setData(zonesToFeatureCollection(zones));
  }, [zones, setData]);

  return null;
}
