import { Matrix4 } from 'three';

import { getPixelsPerMeter } from './mercatorUtils';

import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Mapbox custom layer ↔ Three.js camera bridge (pure helpers).
 *
 * This route does **not** rebuild a full perspective/orthographic matrix from
 * `map.transform` like Threebox CameraSync. It uses Mapbox's per-frame `matrix`
 * from `render(gl, matrix)` and multiplies by the georeference model transform.
 *
 * ---------------------------------------------------------------------------
 * Near-plane / frustum clipping (what `setNearClipOffset` targets)
 * ---------------------------------------------------------------------------
 * Tall overlay meshes can be cut off because they fall outside the view
 * volume—often interacting with Mapbox's internal near-clip behavior.
 * A negative `setNearClipOffset` (in orthographic mode, scaled by expected
 * content height × pixels-per-meter) pushes that boundary so content up to the
 * modeled height is more likely to remain inside the frustum.
 *
 * ---------------------------------------------------------------------------
 * Depth-buffer precision / far plane (different problem)
 * ---------------------------------------------------------------------------
 * Mapbox does not expose a public API to move the far plane. Even when geometry
 * is inside the frustum, a very large effective near-far range can still cause
 * z-fighting or wrong occlusion due to limited depth buffer precision.
 */

const scratchMapboxCustomLayerProjection = new Matrix4();

/**
 * Builds the final Three.js camera projection matrix for a Mapbox custom layer.
 *
 * Render pipeline:
 * - Local coordinates -> `modelTransform` -> Mercator coordinates (Mapbox world)
 * - Mercator coordinates -> `mapboxViewProjectionMatrix` -> screen coordinates
 *
 * Matrix order (left-to-right application for column vectors):
 * `projectionMatrix = mapboxViewProjectionMatrix * modelTransform`
 *
 * Local coordinates -> `projectionMatrix` -> screen coordinates
 *
 * @param mapboxViewProjectionMatrix16 - Per-frame 4x4 matrix from Mapbox
 * custom-layer `render(gl, matrix)`, encoded as a 16-element column-major array.
 * @param modelTransform - Georeference transform that maps local scene meters to
 * Mapbox Mercator world coordinates.
 * @returns Combined matrix to assign to `threeCamera.projectionMatrix`.
 */
export function multiplyMapboxViewProjectionByModelTransform(
  mapboxViewProjectionMatrix16: number[],
  modelTransform: Matrix4,
): Matrix4 {
  return scratchMapboxCustomLayerProjection
    .fromArray(mapboxViewProjectionMatrix16)
    .multiply(modelTransform);
}

/**
 * Returns the value to pass to `map.setNearClipOffset(...)` for overlay geometry.
 *
 * - Orthographic: negative offset scaled by tallest expected content (m) ×
 *   pixels-per-meter at center latitude (tracks zoom).
 * - Perspective: reset to `0` (Mapbox default behavior for this page).
 */
export function computeMapboxNearClipOffsetPixelsForOverlay(
  map: MapboxMap,
  overlayProjectionMode: 'perspective' | 'orthographic',
  maxOrthoOverlayContentHeightM: number,
): number {
  if (overlayProjectionMode !== 'orthographic') {
    return 0;
  }

  const mapPixelsPerMeter = getPixelsPerMeter(map);
  return -(maxOrthoOverlayContentHeightM * mapPixelsPerMeter);
}
