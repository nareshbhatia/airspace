# Mapbox + Three.js

## Overall Goal

Build a page that uses **Mapbox Standard Satellite + terrain** for geospatial
context, while rendering the operational scene geometry in **Three.js** through
a Mapbox custom layer. The 3D content (zones, poles, route, and related assets)
should be owned by the Three.js pipeline, not by Mapbox `fill-extrusion` layers.

The page must support both **perspective** and **orthographic** map modes, with
predictable camera behavior across modes. The camera integration should use the
following sync strategy:

1. Start from Mapbox’s per-frame `matrix`
2. apply the required transforms for Three.js rendering
3. In orthographic mode apply `setNearClipOffset` to reduce clipping of tall
   content

Mapbox-native 3D buildings are intentionally out of scope for this page because
that feature is not available in the selected satellite style.

## Camera integration: projection, view, and two architectural styles

### Projection × view (vocabulary)

3D rendering usually turns **world coordinates** into **clip space** using two
conceptual ingredients:

- **View matrix** — Encodes where the camera sits and how it looks at the scene.
  Conceptually it expresses “coordinates **relative to the camera**.”
- **Projection matrix** — Encodes how 3D is flattened to the screen: perspective
  or orthographic field of view, and the **near** and **far** planes that define
  what depth range is kept.

Together they are often written as **projection × view**: first express the
point in camera space, then project it. (Exact matrix multiply order follows
your engine’s conventions.)

### What Mapbox gives custom layers

Mapbox GL JS calls your custom layer’s `render` function every frame with a
**`matrix`** argument. That matrix is **already a combined transform**
appropriate for that frame—Mapbox’s internal camera and projection (and related
factors) are **baked in**. You do not receive separate `P` and `V` matrices from
the API.

### This project’s approach (matrix from Mapbox × model transform)

This page follows Mapbox’s documented custom-layer pattern:

1. Build the Three.js camera’s `projectionMatrix` from Mapbox’s per-frame
   **`matrix`** multiplied by a **model transform** (georeference): translate to
   the scene’s Mercator origin, scale meters into Mercator units, etc.
2. Separately call **`setNearClipOffset`** when needed (especially in
   **orthographic** mode) so tall overlay geometry is less likely to be cut by
   Mapbox’s internal **near plane** behavior. The offset is scaled using
   **pixels per meter** at the map center so it tracks zoom.

So we **trust Mapbox’s `matrix`** for the main projection path and only add
**placement** (model matrix) and a **small Mapbox API shim** for near clipping.

### Implementation: `mapboxCustomLayerCameraBridge.ts`

The camera **bridge** lives in code as pure helpers (not a second sync
strategy):

- `composeThreeCameraProjectionMatrixFromMapboxCustomLayer` — Mapbox `render`
  `matrix` × georeference model matrix → Three.js `Camera.projectionMatrix`.
- `computeMapboxNearClipOffsetPixelsForOverlay` — orthographic
  `setNearClipOffset` policy (perspective resets to `0`).

The module’s file-level comment repeats the distinction between **near-plane /
frustum clipping** (`setNearClipOffset`) and **depth-buffer precision** (far
plane not app-tunable; other mitigations in this layer). See also **Near-plane
clipping vs depth-buffer precision** below.

### Threebox `CameraSync` ([CameraSync.js](https://github.com/jscastro76/threebox/blob/master/src/camera/CameraSync.js)) — reference approach

[Threebox](https://github.com/jscastro76/threebox) does **not** rely on the
custom-layer `matrix` as the sole source of the Three.js projection. Instead,
**CameraSync** reads **`map.transform`** (size, FOV, pitch, zoom, etc.) and
**rebuilds** a Three.js **perspective or orthographic** projection matrix from
scratch, including explicit **`nearZ`** and **`farZ`** calculations (horizon
distance, pitch, margins to reduce precision issues at the far distance, etc.).
It also maintains a separate **world** group matrix for scaling and panning
content. That design matches “measure the room and build a new window frame.”

### Side-by-side comparison

| Aspect                      | This project                                                                                     | Threebox `CameraSync`                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Primary projection source   | Mapbox **`render`** `matrix` × **model** (georeference)                                          | **Recomputed** from **`map.transform`** + explicit near/far                            |
| Three.js `projectionMatrix` | From Mapbox’s matrix (after model multiply)                                                      | Built with helpers (e.g. perspective/ortho from width/height, `nearZ`, `farZ`)         |
| Near plane tuning           | **`setNearClipOffset`** (Mapbox API), notably in ortho                                           | Computes **`nearZ`** inside projection math; comments tie to Mapbox near behavior      |
| Far plane                   | Whatever Mapbox’s matrix implies; **not** app-tunable                                            | Computes **`farZ`** from frustum/horizon-style logic (plus small margin for precision) |
| Mental model                | “Hang the picture” (model) on Mapbox’s frame (`matrix`); **shim** the sill (`setNearClipOffset`) | “Build the frame” (projection) from raw map camera state                               |

Both can be valid; they are **different architectures**. This repository keeps
**one** path: Mapbox-driven `matrix` + georeference, aligned with
[RewriteLessons.md](./RewriteLessons.md).

### Near-plane clipping vs depth-buffer precision (related, not the same)

- **Near-plane / frustum clipping** — Geometry is **discarded** because it falls
  outside the view volume (e.g. tall meshes clipped by an aggressive **near**
  boundary). **`setNearClipOffset`** addresses Mapbox’s side of that for
  overlays in orthographic mode (scaled by expected content height and
  pixels-per-meter).
- **Depth-buffer precision** — Even when geometry is **inside** the frustum, the
  **finite bits** in the depth buffer can cause **z-fighting** or wrong
  occlusion when the effective **near–far** range is huge, or surfaces are
  nearly coplanar. Mapbox does **not** expose a public **`setFarClipOffset`**;
  mitigations here include **terrain-centered anchoring** (keeps local Z small)
  and optional **orthographic content scaling**, which are **not** the same knob
  as `setNearClipOffset`.

Understanding both helps when comparing this codebase to a full **CameraSync**
style utility that adjusts **near** and **far** explicitly in Three.js.
