import type { AirspaceRoute } from '../../../lib/mapbox';

export type RouteFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.LineString,
  { elevation: number[]; name: string }
>;

export const EMPTY_ROUTE_FEATURE_COLLECTION: RouteFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Mapbox GL JS v3.8+ elevated lines: 2D LineString vertices plus a parallel
 * `elevation` array (meters AGL). Use with `lineMetrics: true` on the GeoJSON
 * source and `line-z-offset` + `at-interpolated` + `line-progress`.
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/example/elevated-line/
 */
export function airspaceRouteToFeatureCollection(
  route: AirspaceRoute,
): RouteFeatureCollection {
  if (route.coordinates.length < 2) {
    return EMPTY_ROUTE_FEATURE_COLLECTION;
  }

  const coordinates: GeoJSON.Position[] = route.coordinates.map(
    ([lng, lat]) => [lng, lat],
  );
  const elevation = route.coordinates.map(([, , aglMeters]) => aglMeters);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: route.name,
          elevation,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    ],
  };
}
