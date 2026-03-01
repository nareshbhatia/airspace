import { boundsToLngLatBoundsLike } from './utils/boundingBox';
import { useFitBounds } from '../../../lib/mapbox';

import type { BoundingBox } from './utils/boundingBox';

interface TrafficMonitorMapFitProps {
  boundingBox: BoundingBox | null | undefined;
}

/**
 * Fits the map to the search area bounding box when an airport is selected.
 * Does nothing when boundingBox is null/undefined.
 */
export function TrafficMonitorMapFit({
  boundingBox,
}: TrafficMonitorMapFitProps) {
  const bounds =
    boundingBox != null ? boundsToLngLatBoundsLike(boundingBox) : undefined;
  useFitBounds(bounds, { padding: 40, maxZoom: 14 });
  return null;
}
