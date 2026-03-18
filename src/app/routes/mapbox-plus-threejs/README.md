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
  altitude in Mercator units. These values are scaled by the world size
  (`tileSize * scale`) and offset from the map center to produce Three.js world
  coordinates.
- Task: Create a helper function `lngLatAltToWorld(lng, lat, altMeters, map)`
  that returns a `THREE.Vector3`. Place cubes at several known lat/lng positions
  and confirm they track the map correctly as you interact with it.

**Step 6 -- Lighting, Materials, and 3D Assets**

- Concept: `MeshStandardMaterial` uses physically-based rendering (PBR) and
  requires scene lights to be visible (without lights, PBR materials render
  black). `AmbientLight` provides uniform illumination; `DirectionalLight`
  simulates sunlight. `BoxGeometry` and `CylinderGeometry` create the basic
  shapes for assets.
- Task: Add lights to the scene. Create several boxes (representing
  building-like assets) and cylinders (representing vertical markers like
  utility poles) at geographic positions around the map center using
  `MeshStandardMaterial` with distinct colors. Observe realistic shading as you
  rotate the map.

**Step 7 -- The Depth Buffer**

- Concept: Mapbox and Three.js share a single depth buffer. When Mapbox renders
  its 3D buildings, it writes depth values. When Three.js renders in the same
  frame, the GPU compares each Three.js fragment's depth against the buffer --
  fragments behind already-rendered Mapbox geometry are discarded (depth test).
  This is correct behavior in 3D perspective mode (a Three.js box behind a
  building is properly hidden). The near/far clipping planes control how
  z-distances map to the [0,1] depth range -- if Mapbox and Three.js use
  different near/far values, the same 3D point maps to different depth values,
  causing incorrect occlusion.
- Task: Position a Three.js box so it partially overlaps with a Mapbox 3D
  building. Observe correct mutual occlusion. Add a temporary toggle button that
  calls `renderer.clearDepth()` before the Three.js render to demonstrate the
  difference: with depth cleared, Three.js content always renders on top of
  Mapbox content. (Step 8 replaces this with the final 2D/3D projection toggle.)

**Step 8 -- 2D/3D Projection Toggle and Orthographic Depth Fix**

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
