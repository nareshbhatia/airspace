import { useEffect, useRef } from 'react';

import { zonesToFeatureCollection } from './utils/zonesToFeatureCollection';
import { useMap, useMapEvent, useMapLayer } from '../../../lib/mapbox';

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

/** Fill opacity: 0.4 when selected (feature-state), 0.25 otherwise. */
const fillOpacityExpression: unknown[] = [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  0.4,
  0.25,
];

/** Line width: 3 when selected (feature-state), 2 otherwise. */
const lineWidthExpression: unknown[] = [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  3,
  2,
];

const FILL_LAYER_ID = 'zone-editor-zones-fill';
const LINE_LAYER_ID = 'zone-editor-zones-line';

const layers: MapLayerSpec[] = [
  {
    id: FILL_LAYER_ID,
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-color': fillColorExpression,
      'fill-opacity': fillOpacityExpression,
    },
  },
  {
    id: LINE_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': fillColorExpression,
      'line-width': lineWidthExpression,
    },
  },
];

interface ZoneEditorZonesLayerProps {
  zones: DrawnZone[];
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
  onDeselect: () => void;
}

/**
 * Renders committed zones as a Mapbox GeoJSON layer with fill and stroke.
 * Color is driven by the zone type via a match expression.
 * Selection is applied via feature-state; map click selects/deselects.
 */
export function ZoneEditorZonesLayer({
  zones,
  selectedZoneId,
  onZoneSelect,
  onDeselect,
}: ZoneEditorZonesLayerProps) {
  const { map } = useMap();
  const { setData } = useMapLayer(SOURCE_ID, layers, { promoteId: 'id' });

  useEffect(() => {
    setData(zonesToFeatureCollection(zones));
  }, [zones, setData]);

  const prevSelectedIdRef = useRef<string | null>(null);
  /**
   * Sync Mapbox feature-state with React selection.
   *
   * Feature-state is per-feature runtime state that the layer paint expressions
   * read via ['feature-state', 'selected']. We use it so the selected zone
   * gets higher fill-opacity (0.4) and line-width (3) without changing the
   * GeoJSON source. This effect runs when selectedZoneId changes:
   *
   * 1. Guard: skip if map or fill layer isn't ready.
   * 2. Clear previous: removeFeatureState for the prior selected feature so
   *    it reverts to normal styling.
   * 3. Store current id in a ref for the next run.
   * 4. Set new: if there is a selection, setFeatureState(..., { selected: true })
   *    so that feature's paint uses the selected opacity/width.
   */
  useEffect(() => {
    if (!map || !map.getLayer(FILL_LAYER_ID)) return;
    const prevId = prevSelectedIdRef.current;
    if (prevId != null) {
      try {
        map.removeFeatureState({ source: SOURCE_ID, id: prevId });
      } catch {
        // ignore if source/feature changed
      }
    }
    prevSelectedIdRef.current = selectedZoneId;
    if (selectedZoneId != null) {
      try {
        map.setFeatureState(
          { source: SOURCE_ID, id: selectedZoneId },
          { selected: true },
        );
      } catch {
        // ignore if source/feature not found
      }
    }
  }, [map, selectedZoneId]);

  // Handle click to select a zone
  useMapEvent(
    'click',
    (e) => {
      const ev = e as { features?: Array<{ properties?: { id?: string } }> };
      const features = ev.features;
      if (features?.length) {
        const id = features[0].properties?.id;
        if (typeof id === 'string') onZoneSelect(id);
      }
    },
    FILL_LAYER_ID,
  );

  // Handle click to deselect a zone
  useMapEvent('click', (e) => {
    if (!map) return;
    const ev = e as { point?: { x: number; y: number } };
    const point = ev.point;
    if (!point) return;
    const features = map.queryRenderedFeatures([point.x, point.y], {
      layers: [FILL_LAYER_ID, LINE_LAYER_ID],
    });
    if (features.length === 0) onDeselect();
  });

  // Handle mouse enter to show pointer
  useMapEvent(
    'mouseenter',
    () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    },
    FILL_LAYER_ID,
  );

  // Handle mouse leave to show default cursor
  useMapEvent(
    'mouseleave',
    () => {
      if (map) map.getCanvas().style.cursor = '';
    },
    FILL_LAYER_ID,
  );

  return null;
}
