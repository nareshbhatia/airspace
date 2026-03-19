# Mapbox + Three.js

## Overall Goal

Build a page that renders a pitched satellite map with two kinds of 3D content
side by side: **Mapbox-native 3D buildings** (using the built-in
`fill-extrusion` layer) and **Three.js 3D assets** (boxes and cylinders rendered
via a Mapbox custom layer). The page also includes a **2D/3D toggle button**
that switches between perspective (3D) and true orthographic (2D) projection
modes, demonstrating how the projection change affects both the Mapbox map and
the Three.js content -- and the depth buffer challenges that come with it.

By the end, we should understand: how Mapbox's custom layer API works, how
Three.js shares Mapbox's WebGL context, how to synchronize cameras, how to
convert geographic coordinates into Three.js world positions, how the depth
buffer mediates visibility between the two renderers, and how to handle the
perspective-to-orthographic projection switch.

The steps are structured so we build incrementally -- each step compiles and
runs on its own, producing a visible result before moving to the next.

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
  simulates sunlight. `BoxGeometry` and `CylinderGeometry` create the basic
  shapes for assets.

  Mapbox and Three.js also share a single depth buffer. Since Mapbox renders
  first, its depth values can occlude your custom layer. A simple way to ensure
  your objects are visible while debugging is to clear the depth buffer before
  rendering Three.js content
  (`gl.clearDepth(1.0); gl.clear(gl.DEPTH_BUFFER_BIT)`). (Later steps will make
  this conditional so we preserve correct occlusion in true 3D perspective
  mode.)

  Finally, call `map.triggerRepaint()` after your Three.js render so Mapbox
  keeps invoking your layer's `render()` callback as the map view changes.

- Task: Add lights to the scene. Create cylinders (representing vertical markers
  like utility poles) for the `utilityPoles` in `src/data/scene3d.ts` at their
  geographic positions. Use `inspectionAltM` as the cylinder height (AGL, i.e.
  the cylinder runs from 0 → `inspectionAltM` above ground) and use
  `MeshStandardMaterial` with distinct colors (or an unlit material while
  debugging). Observe realistic shading as you rotate the map.

**Step 7 -- 2D/3D Projection Toggle and Orthographic Depth Fix**

- Concept: Mapbox supports switching between perspective and orthographic
  projection at runtime via
  `map.setCamera({"camera-projection": "orthographic"})`. In perspective mode,
  the camera has a field of view and objects farther away appear smaller. In
  orthographic mode, the camera looks straight down with no perspective
  distortion -- parallel lines remain parallel. When switching to orthographic,
  the Three.js camera must also switch from `PerspectiveCamera` to
  `OrthographicCamera` with a matching frustum (derive left, right, top, bottom,
  and optionally near/far from `map.transform` and the visible map bounds). A
  critical problem arises: in orthographic mode, Mapbox's map tile depth values
  occlude Three.js content because both renderers write to the shared depth
  buffer with incompatible depth ranges. The fix is to call
  `renderer.clearDepth()` before rendering Three.js content when in orthographic
  mode, erasing Mapbox's depth values so assets render on top of the map
  surface.
- Task: Add a 2D/3D toggle button to the map. When switching to 2D: call
  `map.setCamera({"camera-projection": "orthographic"})`, set pitch to 0, and
  swap the Three.js camera to `OrthographicCamera`. When switching to 3D:
  restore perspective projection and pitch. In the `render()` callback, call
  `renderer.clearDepth()` when in orthographic mode. Verify that Three.js assets
  remain visible in both modes.

## Key Files to Modify/Create

- `src/config/RouteConfig.ts` -- add nav entry for `/mapbox-plus-threejs`
- `src/routes.tsx` -- add route mapping
- `src/app/routes/mapbox-plus-threejs/MapboxPlusThreeJsPage.tsx` -- main page
  component
- `src/app/routes/mapbox-plus-threejs/ThreeJsCustomLayer.ts` -- the custom layer
  class (Three.js init, camera sync, render loop)
- `src/app/routes/mapbox-plus-threejs/geoUtils.ts` -- coordinate conversion
  helpers
