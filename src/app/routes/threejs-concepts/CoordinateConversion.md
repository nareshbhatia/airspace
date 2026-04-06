# Three.js Concepts: Geospatial Coordinates

This note explains the general approach for converting geospatial data into
Three.js coordinates, and how this route's current `buildAirspaceZoneGroup()`
pipeline works.

## Why lat/lng cannot be used directly in Three.js

`lat` and `lng` are angular coordinates on Earth (degrees). Three.js expects
linear Cartesian coordinates (`x`, `y`, `z`) in scene units.

To render geospatial data, we first project lat/lng into a planar coordinate
space and then map those offsets into Three.js axes.

## Coordinate systems at a glance

- Geographic coordinates (`lat`, `lng`): angular, global
- Projected coordinates: planar (for easier math)
- Local scene coordinates: Cartesian (`x`, `y`, `z`) for rendering

Common projected/local approaches:

- **Web Mercator (common in web maps)**: global projected XY used by map tiles;
  simple for map-aligned overlays, with increasing scale distortion away from
  the equator.
- **ENU tangent plane (east-north-up local frame)**: local Cartesian frame
  centered at a chosen origin; excellent local metric behavior for small areas.
- **UTM (zoned metric projection)**: Earth is split into longitudinal zones with
  low local distortion in each zone; good metric accuracy if data stays in one
  zone.

## Web Mercator-focused workflow

1. Pick a local origin near the content (scene center).
2. Convert origin and each point to Web Mercator.
3. Subtract origin from each point to get local horizontal offsets.
4. Convert projection units to meters.
5. Map horizontal offsets to `x/z`, and altitude to `y`.

This route uses meter-like local coordinates so geometry and camera behavior are
consistent.

## Current `buildAirspaceZoneGroup()` pipeline

In `src/app/routes/threejs-concepts/buildAirspaceZoneGroup.ts`:

1. Build a Mercator origin from `centerLngLat`.
2. For each zone footprint point:
   - Convert `[lng, lat]` to local horizontal offsets via
     `mercatorToLocalPosition(...)`.
   - Build local vertex `{ x, y, z }` with:
     - `x = local.x`
     - `z = local.y`
     - `y = floorMetersAgl`
3. Triangulate the horizontal polygon (`x/z`) with
   `ShapeUtils.triangulateShape`.
4. Build a closed volume:
   - floor vertices at per-vertex floor
   - ceiling vertices at `floor + zone.ceilingHeightM`
   - wall triangles between each edge
5. Create `BufferGeometry`, compute normals, and attach a translucent material.

This means per-vertex floor elevations are respected (not a single flat base).

## Units and assumptions

- Scene units are treated as meters.
- Horizontal and vertical dimensions are both meter-based.
- Distortion is acceptable for local scenes (small geographic extents).

For very large extents, prefer stronger geodesic handling or multiple local
origins.

## References

- Web Mercator EPSG:3857: https://epsg.io/3857
- OSM Web Mercator overview: https://wiki.openstreetmap.org/wiki/Web_Mercator
- Mapbox `MercatorCoordinate`:
  https://docs.mapbox.com/mapbox-gl-js/api/geography/#mercatorcoordinate
- Three.js docs: https://threejs.org/docs/
- Three.js manual (creating a scene):
  https://threejs.org/manual/#en/creating-a-scene
