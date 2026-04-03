# Mapbox + Three.js

## Overall Goal

Build a page that renders a pitched satellite map with two kinds of 3D content
side by side: **Mapbox-native 3D buildings** (using the built-in
`fill-extrusion` layer) and **Three.js 3D assets** (poles as cylinders via a
Mapbox custom layer). The page includes a **2D/3D toggle** that switches
Mapbox’s camera between **perspective** (3D) and **orthographic** (2D)
projection so you can compare behavior. The page also offers a **strategy
toggle** (**MX** vs **CS**) between two independent Three.js integration paths.

By the end, we should understand: how Mapbox’s custom layer API works, how
Three.js shares Mapbox’s WebGL context, how geographic coordinates become
Three.js positions via **Mapbox’s `matrix`** and **`modelTransform`**, how the
**shared depth buffer** affects occlusion, and why **Mapbox GL JS ≥ 3.20.0**
matters for orthographic mode.

The steps are structured so we build incrementally — each step compiles and runs
on its own, producing a visible result before moving to the next.

## Architecture: two strategies (shared projection; differ on near-clip)

The page registers **one** custom layer at a time, chosen by the **CS / MX**
toggle (label = the strategy you switch **to** on click):

| Strategy                       | Layer class                    | Uses `render(gl, matrix)` for Three.js?                                                                                |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **mapbox-matrix** (MX default) | `ThreeJsCustomLayer`           | **Yes** — `projectionMatrix = matrix × modelTransform`                                                                 |
| **camera-sync** (CS)           | `ThreeJsCameraSyncCustomLayer` | **Yes** — same `projectionMatrix = matrix × modelTransform`; additionally **`setNearClipOffset`** in orthographic mode |

Pole geometry is built once in **`buildPoleScene`**: lights on the `Scene` root,
all pole meshes under a **`Group`** (`polesGroup`). Both strategies attach
**`polesGroup`** to the **`Scene`** root (meter-space offsets; fixed
**`modelTransform`** from `mercatorUtils`). The standalone **`CameraSync`**
module is a Threebox-style **reference** for manual matrices and is **not**
wired into the active CS layer (see [`CameraSync.ts`](CameraSync.ts) file
comment).

**Depth buffer:** Both layers use `renderingMode: '3d'`, so Mapbox and Three.js
share one depth buffer. Occlusion between fill-extrusion buildings and poles
depends on how closely Three.js clip space matches Mapbox’s for that frame.
**Mapbox GL JS ≥ 3.20.0** improves orthographic behavior
([#13619](https://github.com/mapbox/mapbox-gl-js/issues/13619)); this repo pins
`mapbox-gl` `^3.20.0`. Do **not** clear the depth buffer before Three.js draws.

**Render settings:** Shared: `WebGLRenderer` on Mapbox’s canvas/context,
`autoClear: false`, `resetState()` before `render`, `triggerRepaint()` after,
`frustumCulled = false` on poles.

---

## Strategy A — mapbox-matrix (`ThreeJsCustomLayer`)

### Three.js camera and near / far

- The Three.js object is a plain `THREE.Camera` at **default** position and
  orientation (never updated from `map.transform`).
- You do **not** set numeric `near` / `far` on a `PerspectiveCamera`.
  **Effective** near and far clipping come **entirely** from Mapbox’s per-frame
  **`matrix`** passed into `render()`, after right-multiplying the fixed
  **`modelTransform`** (Mercator origin + meter scale, including negative Y for
  Mercator south).
- So: only **`modelTransform`** is a fixed constant for the layer; **near/far
  are not** fixed Three.js constants — they change whenever Mapbox’s internal
  projection changes (zoom, pitch, bearing, projection mode).

### Mapbox side

- Mapbox computes view–projection for the basemap and supplies the **same**
  matrix to the custom layer. This path does **not** call
  `map.setNearClipOffset` from the layer.

---

## Strategy B — camera-sync (`ThreeJsCameraSyncCustomLayer`)

Uses the **same** Three.js projection as **mapbox-matrix**:
**`camera.projectionMatrix = matrix × modelTransform`** (Mapbox’s per-frame
`matrix` from `render()` plus the fixed geospatial **`modelTransform`** from
`mercatorUtils`). A plain **`THREE.Camera`** at default pose; effective near/far
come from Mapbox’s matrix, not from manual `PerspectiveCamera` settings.

### Mapbox side — `setNearClipOffset` (orthographic only)

Mapbox still draws tiles and buildings with **its own** internal projection. In
orthographic mode, Mapbox’s effective near plane can clip tall 3D content. The
**camera-sync** path calls the experimental **`map.setNearClipOffset`** API:

- **Orthographic:** negative offset ≈
  **`maxOrthoContentHeightM × pixelsPerMeter`** (see `getPixelsPerMeter` in
  `mercatorUtils.ts`).
- **Perspective:** **`setNearClipOffset(0)`** to restore Mapbox defaults.

Typings: `getNearClipOffset` / `setNearClipOffset` are on **`Map`** in recent
`mapbox-gl` releases (marked experimental in JSDoc). Layer **`onRemove`** resets
offset to `0`.

**Reference:** [`CameraSync.ts`](CameraSync.ts) ports Threebox-style manual
projection + world matrices from **`map.transform`**; it is **not** used by the
current CS layer because meter-space **`polesGroup`** content did not match that
world space (poles vanished / clipped). A future integration would need the
scene graph and matrices aligned end-to-end.

---

## Orthographic mode (2D / 3D toggle) — page behavior

The **2D / 3D** button calls `map.setCamera({ 'camera-projection': mode })` and
eases pitch (**0** in 2D, `MAP_VIEW.pitch` in 3D). The active custom layer’s
**`setProjectionMode`** is called so **camera-sync** can apply or clear
**`setNearClipOffset`** when switching to or from orthographic projection. For
**mapbox-matrix**, that callback is a no-op.

## File layout

| File                              | Responsibility                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `threeJsMapLayerTypes.ts`         | `ProjectionMode`, `CameraSyncStrategy`, `ThreeJsMapCustomLayer` interface.       |
| `mercatorUtils.ts`                | Mercator ↔ local meters, `computeModelTransform`, `getPixelsPerMeter`.           |
| `buildPoleScene.ts`               | Lights on scene; pole meshes in `polesGroup` (not necessarily scene root).       |
| `ThreeJsCustomLayer.ts`           | **mapbox-matrix** layer only.                                                    |
| `CameraSync.ts`                   | Reference: Threebox-style manual matrices from `map.transform` (unwired).        |
| `ThreeJsCameraSyncCustomLayer.ts` | **camera-sync** layer: matrix × `modelTransform` + `setNearClipOffset` in ortho. |
| `addThreeJsCustomLayer.ts`        | Factory: picks layer class; always `scene.add(polesGroup)`.                      |
| `MapboxPlusThreeJsPage.tsx`       | Map, buildings, 2D/3D + CS/MX toggles, replaces layer when strategy changes.     |

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
  like poles) for the `poles` in `src/data/scene3d.ts` at their geographic
  positions. Use `topMetersAgl` as the cylinder height (AGL, i.e. the cylinder
  runs from 0 → `topMetersAgl` above ground) and use `MeshStandardMaterial` with
  distinct colors (or an unlit material while debugging). Observe realistic
  shading as you rotate the map.

**Step 7 -- 2D/3D Toggle and Dual Camera Strategies (MX / CS)**

- Concept: Mapbox switches projection with
  `map.setCamera({ "camera-projection": "orthographic" | "perspective" })`. The
  page eases pitch for a 2D-style vs pitched 3D view.

- **Two implementations** (see **Architecture** and strategy sections above):
  - **mapbox-matrix (MX):** `camera.projectionMatrix = matrix × modelTransform`;
    Three.js near/far follow Mapbox’s `matrix`; no `setNearClipOffset`.
  - **camera-sync (CS):** same **`matrix × modelTransform`** projection as MX;
    **`setNearClipOffset`** in orthographic mode for tall content (see Strategy
    B).

- **Implemented UI:** **2D / 3D** — action label on the button. **CS / MX** —
  action label (switch to camera-sync vs mapbox-matrix). Changing strategy
  removes and re-adds the custom layer.

- Task: Compare MX vs CS while panning, zooming, and toggling 2D/3D. In
  orthographic mode, CS should show fewer near-plane clipping artifacts on tall
  poles thanks to **`setNearClipOffset`**; perspective behavior should match MX
  for projection (both use Mapbox’s `matrix`).

## Key Files to Modify/Create

- `src/config/RouteConfig.ts` -- add nav entry for `/mapbox-plus-threejs`
- `src/routes.tsx` -- add route mapping
- `src/app/routes/mapbox-plus-threejs/MapboxPlusThreeJsPage.tsx` -- main page
  component
- `src/app/routes/mapbox-plus-threejs/threeJsMapLayerTypes.ts` -- strategy types
  and shared layer interface
- `src/app/routes/mapbox-plus-threejs/mercatorUtils.ts` -- Mercator / model
  transform helpers
- `src/app/routes/mapbox-plus-threejs/buildPoleScene.ts` -- pole scene content
  (`polesGroup`)
- `src/app/routes/mapbox-plus-threejs/ThreeJsCustomLayer.ts` -- mapbox-matrix
  custom layer
- `src/app/routes/mapbox-plus-threejs/CameraSync.ts` -- Threebox-style camera
  sync
- `src/app/routes/mapbox-plus-threejs/ThreeJsCameraSyncCustomLayer.ts` --
  camera-sync custom layer
- `src/app/routes/mapbox-plus-threejs/addThreeJsCustomLayer.ts` -- factory +
  layer registration
