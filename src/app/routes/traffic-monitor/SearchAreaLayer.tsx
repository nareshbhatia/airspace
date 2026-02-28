import { useEffect } from 'react';

import { bboxToFeatureCollection } from './utils/boundingBox';
import { useMapLayer } from '../../../lib/mapbox';

import type { BoundingBox } from './utils/boundingBox';
import type { MapLayerSpec } from '../../../lib/mapbox';

/** Subtle blue for search area: ~10% fill, ~40% stroke (per requirements). */
const SEARCH_AREA_FILL = 'rgba(59, 130, 246, 0.1)';
const SEARCH_AREA_STROKE = 'rgba(59, 130, 246, 0.4)';

const layers: MapLayerSpec[] = [
  {
    id: 'search-area-fill',
    type: 'fill',
    source: 'search-area',
    paint: {
      'fill-color': SEARCH_AREA_FILL,
      'fill-opacity': 1,
      'fill-outline-color': SEARCH_AREA_STROKE,
    },
  },
];

interface SearchAreaLayerProps {
  boundingBox: BoundingBox | null | undefined;
}

/**
 * Renders the search area bounding box as a Mapbox fill layer. Hidden when
 * boundingBox is null/undefined (empty FeatureCollection).
 */
function SearchAreaLayer({ boundingBox }: SearchAreaLayerProps) {
  const { setData } = useMapLayer('search-area', layers);

  useEffect(() => {
    setData(
      boundingBox != null
        ? bboxToFeatureCollection(boundingBox)
        : { type: 'FeatureCollection', features: [] },
    );
  }, [boundingBox, setData]);

  return null;
}

export { SearchAreaLayer };
