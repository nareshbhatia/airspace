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
