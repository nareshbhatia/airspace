import type { AirspaceScene } from '../../../lib/mapbox';
import type { LngLatLike } from 'mapbox-gl';

/**
 * Converts Mapbox's `LngLatLike` union to a strict `[lng, lat]` tuple.
 */
export function lngLatLikeToTuple(center: LngLatLike): [number, number] {
  if (Array.isArray(center)) {
    return [Number(center[0]), Number(center[1])];
  }
  if ('lng' in center) {
    return [center.lng, center.lat];
  }
  return [center.lon, center.lat];
}

/**
 * Returns the best available scene center for georeferencing Three.js content.
 * Falls back to the first zone footprint point when mapProvider center is absent.
 */
export function getSceneCenterLngLat(scene: AirspaceScene): [number, number] {
  const centerLike = scene.mapProvider.center;
  if (centerLike != null) {
    return lngLatLikeToTuple(centerLike);
  }

  const firstFootprintPoint = scene.zones[0]?.footprint[0];
  if (firstFootprintPoint) {
    return [firstFootprintPoint.lng, firstFootprintPoint.lat];
  }

  return [0, 0];
}
