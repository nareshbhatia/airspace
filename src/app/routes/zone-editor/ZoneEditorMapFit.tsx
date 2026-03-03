import { useMemo } from 'react';

import { polygonToBounds } from './utils/polygonToBounds';
import { useFitBounds } from '../../../lib/mapbox';

import type { DrawnZone } from './types';

interface ZoneEditorMapFitProps {
  selectedZone: DrawnZone | null;
}

/**
 * Fits the map to the selected zone's bounding box when a zone is selected.
 * Does nothing when selectedZone is null.
 */
export function ZoneEditorMapFit({ selectedZone }: ZoneEditorMapFitProps) {
  const bounds = useMemo(
    () => (selectedZone ? polygonToBounds(selectedZone.geometry) : undefined),
    [selectedZone],
  );
  useFitBounds(bounds, { padding: 40, maxZoom: 14 });
  return null;
}
