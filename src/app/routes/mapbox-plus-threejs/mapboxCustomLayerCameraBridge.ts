import { Matrix4 } from 'three';

import { getPixelsPerMeter } from '../../../lib/mapbox/utils/mercatorUtils';

import type { ProjectionMode } from './types';
import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Mapbox custom layer ↔ Three.js camera bridge (pure helpers).
 *
 * This route does **not** rebuild a full perspective/orthographic matrix from
 * `map.transform` like Threebox CameraSync. It uses Mapbox’s per-frame `matrix`
 * from `render(gl, matrix)` and multiplies by the georeference model transform.
 * See README.md (“This project’s approach” vs “Threebox CameraSync”).
 *
 * ---------------------------------------------------------------------------
 * Near-plane / frustum clipping (what `setNearClipOffset` targets)
 * ---------------------------------------------------------------------------
 * Tall overlay meshes can be **cut off** because they fall outside the view
 * volume—often interacting with Mapbox’s internal near-clip behavior (often
 * discussed in terms of a small baseline in pixel space relative to map height).
 * A **negative** `setNearClipOffset` (in orthographic mode, scaled by expected
 * content height × pixels-per-meter) **pushes** that boundary so content up to
 * the modeled height is more likely to remain **inside** the frustum.
 *
 * ---------------------------------------------------------------------------
 * Depth-buffer precision / far plane (different problem)
 * ---------------------------------------------------------------------------
 * Mapbox does **not** expose a public API to move the **far** plane. Even when
 * geometry is inside the frustum, a very large effective **near–far** range can
 * still cause **z-fighting** or wrong occlusion due to limited depth buffer
 * precision. Mitigations used elsewhere in this layer are **orthogonal**:
 * terrain-centered anchoring (keeps local Z small), optional orthographic
 * **content scale** on the root group—not the same knob as `setNearClipOffset`.
 *
 * ---------------------------------------------------------------------------
 */

const scratchMapboxCustomLayerProjection = new Matrix4();

/**
 * Composes the Three.js camera `projectionMatrix` for this custom-layer pipeline.
 *
 * Mapbox passes a 16-element column-major matrix each frame; we post-multiply
 * by the georeference model matrix (Mercator origin + meter scale) so scene
 * vertices in meters land in Mapbox clip space.
 *
 * Order matches Mapbox + Threebox custom-layer examples: projection-from-map
 * × modelTransform.
 */
export function composeThreeCameraProjectionMatrixFromMapboxCustomLayer(
  mapboxCustomLayerMatrix16: number[],
  threeJsGeoreferenceModelMatrix: Matrix4,
): Matrix4 {
  return scratchMapboxCustomLayerProjection
    .fromArray(mapboxCustomLayerMatrix16)
    .multiply(threeJsGeoreferenceModelMatrix);
}

/**
 * Returns the value to pass to `map.setNearClipOffset(...)` for overlay geometry.
 *
 * - **Orthographic:** negative offset scaled by tallest expected content (m) ×
 *   pixels-per-meter at center latitude (tracks zoom).
 * - **Perspective:** reset to `0` (Mapbox default behavior for this page).
 */
export function computeMapboxNearClipOffsetPixelsForOverlay(
  map: MapboxMap,
  overlayProjectionMode: ProjectionMode,
  maxOrthoOverlayContentHeightM: number,
): number {
  if (overlayProjectionMode !== 'orthographic') {
    return 0;
  }

  const mapPixelsPerMeter = getPixelsPerMeter(map);
  return -(maxOrthoOverlayContentHeightM * mapPixelsPerMeter);
}
