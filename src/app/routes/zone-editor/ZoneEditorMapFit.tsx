import { useMemo } from 'react';

import { bbox } from '@turf/bbox';

import { useFitBounds } from '../../../lib/mapbox';

import type { DrawnZone } from './types';
import type { LngLatBoundsLike } from 'mapbox-gl';

interface ZoneEditorMapFitProps {
  selectedZone: DrawnZone | null;
}

/**
 * Fits the map to the selected zone's bounding box when a zone is selected.
 * Does nothing when selectedZone is null.
 */
export function ZoneEditorMapFit({ selectedZone }: ZoneEditorMapFitProps) {
  const bounds = useMemo(() => {
    if (!selectedZone) return undefined;

    const ring = selectedZone.geometry.coordinates[0];
    if (!ring?.length) return undefined;

    const extent = bbox(selectedZone.geometry);
    return [extent[0], extent[1], extent[2], extent[3]] as LngLatBoundsLike;
  }, [selectedZone]);

  useFitBounds(bounds, { padding: 40, maxZoom: 14 });
  return null;
}
