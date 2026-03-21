# Mapbox + Three.js

## Overall Goal

Build a page that renders a pitched satellite map with two kinds of 3D content
side by side: **Mapbox-native 3D buildings** (using the built-in
`fill-extrusion` layer) and **Three.js 3D assets** (utility poles as cylinders
via a Mapbox custom layer). The page includes a **2D/3D toggle** that switches
Mapbox’s camera between **perspective** (3D) and **orthographic** (2D)
projection so you can see both renderers behave under the same projection
matrix.

By the end, we should understand: how Mapbox’s custom layer API works, how
Three.js shares Mapbox’s WebGL context, how geographic coordinates become
Three.js positions with a baked **model transform**, how the **shared depth
buffer** occludes Mapbox buildings against Three.js meshes, and why **Mapbox GL
JS ≥ 3.20.0** matters for orthographic mode.

The steps are structured so we build incrementally — each step compiles and runs
on its own, producing a visible result before moving to the next.

## Architecture (custom layer + Three.js)

Mapbox invokes your custom layer’s `render(gl, matrix)` each frame with a
**view–projection matrix** already in clip space for the current camera
(perspective or orthographic). This implementation does **not** sync a separate
Three.js camera from `map.transform`. Instead, it keeps scene geometry in
**meters near a local origin**, then each frame sets:

`camera.projectionMatrix = mapboxMatrix * modelTransform`

where `modelTransform` translates to a reference `MercatorCoordinate` and scales
meters into Mercator units (with a **negative Y scale** so Three.js Y-up maps to
Mapbox’s Mercator Y-south convention). Three.js uses that single matrix for both
projection modes, so poles stay aligned when toggling 2D/3D.

**Depth buffer:** Mapbox and Three.js use the **same** WebGL depth buffer (the
custom layer uses `renderingMode: '3d'`). That allows **correct occlusion**: a
Mapbox building that is closer in depth can hide part of a pole, and vice versa.
Earlier Mapbox GL JS versions had an orthographic bug where the effective near
plane could clip custom-layer content at high zoom; that is **fixed in 3.20+**
([mapbox/mapbox-gl-js#13619](https://github.com/mapbox/mapbox-gl-js/issues/13619)).
This project pins **`mapbox-gl` `^3.20.0`** so that fix is always available. We
**do not** clear the depth buffer before Three.js draws — clearing would discard
Mapbox’s depth and break building-vs-pole occlusion.

**Render settings:** `WebGLRenderer` is created with Mapbox’s canvas and
context, `autoClear` stays **false** (Three.js must not wipe Mapbox’s color
buffer), and `resetState()` runs before each Three.js draw because Mapbox may
leave GL state dirty. Pole meshes use `frustumCulled = false` because with the
baked matrix approach, Three.js frustum culling can be unreliable.

## Orthographic mode (2D / 3D toggle)

The toggle calls `map.setCamera({ 'camera-projection': mode })` with
`'orthographic'` or `'perspective'`. In orthographic mode the page also eases
pitch to **0** for a map-like top-down view; in perspective mode it restores the
configured pitch. Three.js content does **not** switch to a separate
`OrthographicCamera` — it continues to use Mapbox’s **`matrix`** argument, which
already encodes the active projection.

## File layout

| File                        | Responsibility                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `mercatorUtils.ts`          | Pure math: Mercator ↔ local meter offsets, `computeModelTransform` for the camera matrix.    |
| `buildPoleScene.ts`         | Scene **content**: lights, cylinders, materials, mesh placement from `UtilityPole[]`.        |
| `ThreeJsCustomLayer.ts`     | Custom layer **infrastructure**: renderer/camera lifecycle, `render` / `onRemove`, disposal. |
| `addThreeJsCustomLayer.ts`  | Wires `buildPoleScene` + `ThreeJsCustomLayer` and registers the layer on the map.            |
| `MapboxPlusThreeJsPage.tsx` | React page: map setup, buildings, layer registration, projection toggle.                     |

## General guidelines

- Each step should produce a working, visible result that we can verify before
  proceeding to the next
- Reuse the existing `MapProvider` (from `src/lib/mapbox`), `ZoomControl`, and
  sample data from `src/data/scene3d.ts`; layer helpers such as `addBuildings`
  live in `src/lib/mapbox/utils/scene3d.ts` if needed
- Use raw Three.js (not React Three Fiber) for the custom layer integration,
  since R3F manages its own render loop which conflicts with Mapbox's `render()`
  callback pattern
- Include inline code comments explaining each concept as it is introduced
- The 2D/3D toggle should use Mapbox's native
  `map.setCamera({"camera-projection": "orthographic"})` API -- no external
  libraries or wrappers

## Build Steps

**Step 1 -- Mapbox 3D Buildings**

- Concept: Mapbox's `fill-extrusion` layer renders 3D buildings from vector tile
  data.
- Task: Show a map with 3D buildings (fill-extrusion from the composite source)
  similar to the existing Mapbox 3D Scene page (route `/mapbox-3d-scene`).

**Step 2 -- Custom Layer Shell**

- Concept: Mapbox's `CustomLayerInterface` (`id`, `type: "custom"`,
  `renderingMode: "3d"`, `onAdd`, `render`) lets you inject your own WebGL draw
  calls into the rendering pipeline. `renderingMode: "3d"` tells Mapbox to
  preserve the depth buffer so your content can participate in depth testing
  with Mapbox's own 3D layers.
- Task: Add a custom layer that logs to the console on each `render()` call,
  confirming the lifecycle works.

**Step 3 -- Initialize Three.js in the Shared WebGL Context**

- Concept: A single `<canvas>` element has one WebGL context. Mapbox owns it.
  Three.js must reuse it by passing `{ canvas, context }` to
  `new THREE.WebGLRenderer()`. Setting `autoClear: false` prevents Three.js from
  clearing Mapbox's already-rendered frame. Calling `renderer.resetState()`
  before each draw resets Three.js's internal WebGL state cache, because Mapbox
  may have changed GL state (bound shaders, blend modes, etc.) since the last
  Three.js draw.
- Task: Create a `THREE.Scene`, `THREE.PerspectiveCamera`, and
  `THREE.WebGLRenderer` inside `onAdd`. In `render()`, call
  `renderer.resetState()` then `renderer.render(scene, camera)`. Add a simple
  `MeshBasicMaterial` cube at the origin to confirm Three.js is drawing (it
  won't be at the right position yet).

**Step 4 -- Camera Synchronization**

- Concept: Mapbox exposes its camera via `map.transform` (center, zoom, pitch,
  bearing, fov, width, height). Three.js needs a matching projection matrix
  (mapping camera-space to clip-space) and view/camera matrix (positioning the
  camera in the world). Without synchronization, Three.js objects won't appear
  at correct screen positions relative to the map.
- Task: In each `render()` call, read `map.transform` and build a Three.js
  `PerspectiveCamera` projection matrix that matches Mapbox's. Compute a camera
  matrix from pitch and bearing. Add a colored cube at the map center to verify
  it stays anchored as you pan, zoom, and rotate.

**Step 5 -- Geographic Coordinate Conversion**

- Concept: Mapbox uses a Web Mercator coordinate system internally.
  `MercatorCoordinate.fromLngLat()` converts `[lng, lat, altMeters]` to
  normalized Mercator values in [0,1]. The Mercator `z` value represents
  altitude in Mercator units. While you _can_ place meshes directly in raw
  Mercator coordinates, that often produces tiny mesh scales (e.g. ~3e-8) and
  fragile float precision / frustum culling behavior in Three.js.

  A more robust approach (used by Mapbox's custom-layer examples) is to keep
  your Three.js scene in **meter space near the origin** and bake the
  georeferencing into the camera each frame:
  - Pick a single **reference point** (lng/lat/alt) as the scene origin.
  - Convert that origin to Mercator and compute
    `meterInMercatorCoordinateUnits()`.
  - Build a model transform:
    `translation(originMerc) * scale(meterScale, -meterScale, meterScale)`. The
    negative Y flips Three.js's Y-up into Mapbox's Mercator Y-south convention.
  - Set `camera.projectionMatrix = mapboxMatrix * modelTransform` in `render()`.

  With this pattern, meshes use stable meter offsets from the origin
  (tens/hundreds of meters), and the camera matrix handles mapping into Mapbox's
  coordinate space.

- Task: Create a helper function `lngLatAltToWorld(lng, lat, altMeters, map)`
  that returns a `THREE.Vector3`. Place cubes at several known lat/lng positions
  and confirm they track the map correctly as you interact with it.

**Step 6 -- Lighting, Materials, and 3D Assets**

- Concept: `MeshStandardMaterial` uses physically-based rendering (PBR) and
  requires scene lights to be visible (without lights, PBR materials render
  black). `AmbientLight` provides uniform illumination; `DirectionalLight`
  simulates sunlight. `CylinderGeometry` creates the basic shape for vertical
  markers.

  Mapbox and Three.js share one depth buffer. **Do not** clear the depth buffer
  before drawing Three.js content if you want buildings and poles to occlude
  each other correctly.

  Call `map.triggerRepaint()` after your Three.js render so Mapbox keeps
  invoking your layer's `render()` callback as the map view changes.

- Task: Add lights to the scene. Create cylinders (representing vertical markers
  like utility poles) for the `utilityPoles` in `src/data/scene3d.ts` at their
  geographic positions. Use `inspectionAltM` as the cylinder height (AGL, i.e.
  the cylinder runs from 0 → `inspectionAltM` above ground) and use
  `MeshStandardMaterial` with distinct colors (or an unlit material while
  debugging). Observe realistic shading as you rotate the map.

**Step 7 -- 2D/3D Projection Toggle**

- Concept: Mapbox supports switching between perspective and orthographic
  projection at runtime via
  `map.setCamera({"camera-projection": "orthographic"})`. In perspective mode,
  the camera has a field of view and objects farther away appear smaller. In
  orthographic mode, parallel lines stay parallel; combined with pitch 0, the
  view reads as 2D. Three.js continues to use the **`matrix`** from
  `render(gl, matrix)` in both modes — no separate Three.js orthographic camera
  is required.

- Task: Add a 2D/3D toggle button. When switching to 2D: set orthographic
  projection and ease pitch to 0. When switching to 3D: restore perspective and
  the map’s configured pitch. Verify poles and buildings occlude each other
  sensibly in both modes (requires Mapbox GL JS **≥ 3.20.0** for orthographic
  depth behavior).

## Key Files to Modify/Create

- `src/config/RouteConfig.ts` -- add nav entry for `/mapbox-plus-threejs`
- `src/routes.tsx` -- add route mapping
- `src/app/routes/mapbox-plus-threejs/MapboxPlusThreeJsPage.tsx` -- main page
  component
- `src/app/routes/mapbox-plus-threejs/mercatorUtils.ts` -- Mercator / model
  transform helpers
- `src/app/routes/mapbox-plus-threejs/buildPoleScene.ts` -- pole scene content
- `src/app/routes/mapbox-plus-threejs/ThreeJsCustomLayer.ts` -- custom layer
  lifecycle and render loop
- `src/app/routes/mapbox-plus-threejs/addThreeJsCustomLayer.ts` -- compose scene
  - layer registration
