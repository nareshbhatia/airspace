import { useMemo } from 'react';

import { bbox } from '@turf/bbox';

import { airspaceRouteToFeatureCollection } from './airspaceRouteToFeatureCollection';
import { useFitBounds } from '../../../lib/mapbox';

import type { AirspaceRoute } from '../../../lib/mapbox';
import type { LngLatBoundsLike } from 'mapbox-gl';

interface MapBoxRouteFitProps {
  route: AirspaceRoute | undefined;
}

/**
 * Fits the map to the horizontal extent of the route whenever it changes.
 * Does nothing when route is missing, empty, or has no drawable coordinates.
 */
export function MapBoxRouteFit({ route }: MapBoxRouteFitProps) {
  const bounds = useMemo((): LngLatBoundsLike | undefined => {
    if (!route?.coordinates?.length) return undefined;

    const featureCollection = airspaceRouteToFeatureCollection(route);
    if (!featureCollection.features.length) return undefined;

    const extent = bbox(featureCollection);
    const [west, south, east, north] = extent;
    if (
      !Number.isFinite(west) ||
      !Number.isFinite(south) ||
      !Number.isFinite(east) ||
      !Number.isFinite(north)
    ) {
      return undefined;
    }

    return [west, south, east, north] as LngLatBoundsLike;
  }, [route]);

  useFitBounds(bounds, { padding: 100, duration: 2000 });
  return null;
}
