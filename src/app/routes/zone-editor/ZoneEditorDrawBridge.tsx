import { useEffect } from 'react';

import { useDraw, useMapEvent } from '../../../lib/mapbox';

import type MapboxDraw from '@mapbox/mapbox-gl-draw';

interface ZoneEditorDrawBridgeProps {
  onDrawReady: (draw: MapboxDraw | null) => void;
  onDrawCreate: (e: { features: GeoJSON.Feature[] }) => void;
}

/**
 * Must be used as a child of MapProvider so that `useDraw()` (below) can
 * access the map and add the Mapbox Draw control. The effect then passes
 * the Draw instance to the parent via `onDrawReady(draw)`, and calls
 * `onDrawReady(null)` on unmount so the parent can clear its reference.
 * That lets the parent control drawing (e.g. changeMode, deleteAll) from
 * outside the map—e.g. from the sidebar.
 */
export function ZoneEditorDrawBridge({
  onDrawReady,
  onDrawCreate,
}: ZoneEditorDrawBridgeProps) {
  // useDraw() returns the Mapbox Draw instance, or null if the map is not ready yet
  const draw = useDraw({ displayControlsDefault: false });
  useEffect(() => {
    onDrawReady(draw);
    return () => {
      onDrawReady(null);
    };
  }, [draw, onDrawReady]);

  useMapEvent('draw.create', (e: unknown) => {
    onDrawCreate(e as { features: GeoJSON.Feature[] });
  });

  return null;
}
