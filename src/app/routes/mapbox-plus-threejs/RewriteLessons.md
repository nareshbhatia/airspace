# Mapbox + Three.js Rewrite Lessons

This note captures implementation guidance for rebuilding
`MapboxPlusThreeJsPage` from scratch using patterns from:

- `mapbox-concepts-standard-satellite`
- `threejs-concepts`
- `lib/mapbox` and `lib/threejs`

The goal is a cleaner, modular architecture with one clear camera strategy and
well-defined 2D/3D behavior.

## What To Keep

- Keep `MapProvider` as the host container and continue using
  `mapOptions={{ antialias: true }}` for clean 3D edges.
- Keep the map-first render model: Mapbox remains the driving renderer and frame
  source.
- Keep a projection mode state (`perspective` vs `orthographic`) and explicit UX
  controls to switch modes.
- Keep orthographic handling that improves tall-content clipping by using
  `setNearClipOffset(...)` only when in 2D/orthographic mode.
- Keep reuse of shared helpers from `lib/mapbox` (for map primitives and UI) and
  `lib/threejs` (for Three.js primitives/types/utilities).
- Keep cleanup discipline for custom layer teardown (dispose
  geometries/materials, dispose renderer, reset offsets on remove).

## One Camera Sync Strategy (Final Decision)

Use only one strategy in the rewrite:

1. Start from Mapbox's per-frame matrix (`render(gl, matrix)`).
2. Apply model transform/georeference transform as needed (same spirit as
   current `matrix x modelTransform`).
3. Incorporate Threebox-style camera-sync math where it adds value
   (camera/frustum/world-matrix shaping), but keep a single internal path.
4. Apply experimental `setNearClipOffset` in orthographic mode only, to reduce
   clipping of tall content.
5. Reset near-clip offset when returning to perspective or when layer is
   removed.

No runtime toggle for sync strategies should exist in the next version.

## Lessons Learned From `mapbox-concepts-standard-satellite`

- Separate page shell from map overlay concerns. Keep the page component focused
  on state orchestration and map bootstrapping; move controls into a dedicated
  overlay component.
- Prefer reusable map UI components (panel, mode toggle, displays, selectors)
  from `lib/mapbox` rather than one-off controls embedded in the page.
- Use composable, scene-oriented helper functions for map additions (`add...`
  style functions) rather than one large `onLoad` body.
- Preserve intentional layer ordering as a first-class design concern, not an
  accidental byproduct of call order.
- Favor explicit state naming and compact top-level state transitions over
  ad-hoc mutations in callbacks.

## Lessons Learned From `threejs-concepts`

- Separate scene lifecycle from page state: initialize/dispose Three.js runtime
  in one place, then update scene content through explicit API calls.
- Keep coordinate conversion explicit and documented; avoid hidden assumptions
  about units.
- Use a stable local origin and meter-based local coordinates for predictable
  geometry/camera behavior in local extents.
- Build a minimal, testable API boundary for Three.js scene updates (for
  example, `setSceneAndCenter(...)`) instead of mutating internals directly from
  the page.

## Things To Avoid In The Rewrite

- Avoid dual strategy toggles (`mapbox-matrix` vs `camera-sync`) and associated
  UI/tooltips. One strategy reduces complexity and drift.
- Avoid coupling the page component to custom layer replacement logic beyond a
  narrow facade (for example, `attachThreeLayer`, `updateProjectionMode`).
- Avoid mixing conceptual concerns (UI toggles, layer lifecycle, sync math,
  projection policy) in one file.
- Avoid "reference-only" modules that are not wired into runtime behavior unless
  explicitly documented as non-production experiments.
- Avoid copy-pasting bespoke map controls when equivalent shared components
  exist.
- Avoid ambiguous naming that suggests independent systems while they are
  actually one pipeline (Mapbox-driven render with Three.js overlay).

## Suggested Modular Structure For Rebuild

Create small modules with clear boundaries:

- `MapboxPlusThreeJsPage.tsx`
  - Owns high-level state (scene, projection mode, feature flags if any).
  - Renders `MapProvider` and overlay components.
- `MapboxPlusThreeJsOverlay.tsx`
  - Owns the top-right UI controls (mode toggle, diagnostics if needed).
- `mapboxPlusThreeLayer.ts`
  - Facade to add/remove/update the custom Three.js layer.
- `MapboxThreeCustomLayer.ts`
  - Single custom-layer implementation with one sync pipeline.
- `cameraSync/` (optional internal folder)
  - Pure math utilities for matrix/frustum/clip computations.
- `georeference.ts`
  - Origin/model transform and unit conversion helpers.

Keep each module single-purpose and make cross-module contracts explicit via
types.

## Projection Mode Policy

- `perspective` mode:
  - Set Mapbox camera projection to perspective.
  - Use normal near/far behavior (`setNearClipOffset(0)`).
  - Restore desired pitch for 3D context.
- `orthographic` mode:
  - Set Mapbox camera projection to orthographic.
  - Flatten pitch as needed for true 2D behavior.
  - Apply negative `setNearClipOffset` derived from
    `maxOrthoContentHeightM * pixelsPerMeter`.

Projection changes should be centralized in one function so map and custom layer
remain consistent.

## Practical Rewrite Checklist

- Define final public types first (`ProjectionMode`, custom-layer API, options).
- Remove `CameraSyncStrategy` concept from the new page flow.
- Build/port one sync path and verify it in both projection modes.
- Verify orthographic clipping improvement with tall poles/zones.
- Verify cleanup path always resets near-clip offset and disposes Three.js
  resources.
- Keep docs in sync with implementation so no stale "reference-only" confusion
  remains.

## Success Criteria For New Implementation

- The page architecture mirrors the modularity quality of the concepts pages.
- Mapbox and Three.js responsibilities are clearly separated.
- Camera/projection behavior is predictable across both modes.
- Only one sync strategy exists in code and UI.
- The implementation relies on reusable `lib/mapbox` / `lib/threejs` utilities
  wherever feasible.
