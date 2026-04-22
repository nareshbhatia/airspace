# WGS84 vs Web Mercator Coordinate System

## What Is Mercator Projection?

In this codebase, "mercator" refers to the Web Mercator projection used by Mapbox for map rendering.

- Geographic coordinates (`lng`, `lat`) are converted into projected map coordinates.
- Mapbox exposes this via `MercatorCoordinate.fromLngLat(...)`.
- In our Three.js custom layer flow, Mercator is the bridge between geospatial data in `lng` / `lat` and render-space math.

`src/lib/mapbox/utils/mercatorUtils.ts` has the conversion helpers between these coordinate systems.

## WGS84 vs Web Mercator

### WGS84 (EPSG:4326)

- Geodetic coordinate system on an ellipsoid (often informally described as "on the globe").
- Coordinates are in degrees (`lat/lon`) plus optional altitude.

### Web Mercator (EPSG:3857)

- Projected coordinate system on a flat map plane.
- Designed for tiled web maps and fast rendering.
- Distorts area/scale significantly at high latitudes.

Practical mental model: **WGS84 is for geographic positions; Web Mercator is for map rendering coordinates.**

## Are These Coordinates Relative to a Zero Reference?

Yes.

- EPSG:3857 meters: origin is at longitude 0, latitude 0.
- Mapbox normalized Mercator coordinates:
  - `x=0` at 180W, `x=1` at 180E
  - `y=0` at north Web Mercator limit, `y=1` at south limit
  - `(0.5, 0.5)` corresponds to lon/lat `(0, 0)`

Altitude in Mapbox custom-layer math is converted into Mercator world units using `meterInMercatorCoordinateUnits()`.

## Why Mapbox Uses Mercator Even in 3D

Mapbox can render terrain/buildings/models in 3D while still using a Mercator-based engine because:

- Tile addressing and streaming are based on Web Mercator.
- Style and symbol layout systems are projection-oriented.
- Performance and ecosystem compatibility are optimized around 3857.

So the system is "3D visualization on top of a Mercator map pipeline," not a full switch to a globe-native Cartesian coordinate system for all rendering.

## Why Terrain Elevation and a Georeference Origin Are Needed

In `ThreejsRouteLayer`, `applyGeoreferenceOrigin(...)` updates a model transform matrix from map center + terrain elevation.

Purpose:

1. Align Three.js content vertically with Mapbox terrain.
2. Keep local coordinates small for better numerical stability.
3. Provide a stable anchor that maps local scene coordinates back into Mapbox Mercator space.

This function has side effects (updates `mapModelTransform`) and intentionally returns nothing.

## How Lat/Lon Points End Up Rendering in Three.js

Pipeline used in this project:

1. Start with route points in WGS84: `([lng, lat], altitude)`.
2. Convert each point to Mercator, then Convert to local offsets relative to an origin (`lngLatToLocalPosition`).
4. Build Three geometry in local coordinates (`Vector3`).
5. Apply `mapMatrix * modelTransform` in custom-layer render to align with map camera/projection.

This is why you can author in lat/lon while still rendering correctly in Three.js.

## Key Takeaways

- WGS84 is your input coordinate space; Mercator is the render/projection space.
- Mapbox custom layers need a georeference transform to connect local Three geometry to map coordinates.
- Terrain-aware anchoring improves vertical alignment and precision.
