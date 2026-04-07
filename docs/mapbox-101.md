# Mapbox 101

If you are building anything that puts data on a map – routes, zones, live positions – you will spend most of your time thinking in **three ideas**: a **style** (what the world looks like), **sources** (where your data lives), and **layers** (how that data is drawn). This short guide is the mental model I wish I had on day one, plus a few patterns that keep apps fast and readable.

Code snippets in this article are taken from my [airspace](https://github.com/nareshbhatia/airspace) repo (and adapted where helpful).

---

## Mapbox is a 3D renderer; “2D” is a familiar special case

It is easy to think of Mapbox GL JS as a flat slippy map. Under the hood it is a **WebGL** renderer: it draws raster and vector tiles, can drape **terrain**, and can extrude polygons into **3D volumes**. Tilting the camera (“pitch”) does not turn on a different engine – it is the same pipeline with a different view.

What we usually call a **“2D map”** in product design is a **special case** of that pipeline:

- **Top-down view** – pitch at or near **0°**, so you are looking straight down at the ground.
- **Orthographic projection** – parallel lines stay parallel; scale feels like a paper map. In Mapbox GL JS you select this with the camera API.

A typical **“3D map”** experience uses **perspective** projection (things farther away look smaller) and often a **non-zero pitch** so buildings, terrain, and vertical assets read with depth.

```typescript
// Example: switching projection (see Mapbox GL JS docs for the full API)
map.setCamera({
  'camera-projection': 'orthographic', // “flat map” feel
});
// Often paired with pitch: 0 for a top-down view
map.easeTo({ pitch: 0 });
```

You _can_ have pitch 0 while still in perspective in some apps; the combination users associate with “classic 2D” is usually **top-down + orthographic** (and often north-up bearing). The point is pedagogical: **start from 3D capability**, then narrow to the 2D look when you need it.

**Visual idea:** Side-by-side screenshots of the same location with orthographic + pitch 0 vs perspective + pitch 45 – label projection and pitch.

---

## Style, camera, and one rule for coordinates

A **style** URL (for example Mapbox Standard or Standard Satellite) decides the basemap: which layers exist out of the box, labels, terrain, and so on.

The **camera** is controlled with center, zoom, **pitch** (tilt toward the horizon), and **bearing** (rotation around the map). One rule trips up almost everyone the first time:

**Longitude comes first, then latitude** – `[lng, lat]`, not the other way around.

```typescript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard-satellite',
  center: [-71.06, 42.36], // Boston-ish: lng, lat
  zoom: 15,
  pitch: 50,
  bearing: -20,
  antialias: true, // worth setting for extruded / 3D edges
});
```

**Visual idea:** A tiny diagram of the globe with an arrow labeled “lng first” pointing along the equator, then “lat” toward a pole.

---

## Sources vs layers (the pattern that unlocks everything)

Think of a **source** as raw data attached to an id, and a **layer** as instructions for how to draw that data. One source can feed **multiple** layers – same geometry, different styles.

```typescript
map.addSource('zones', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [],
  },
});

map.addLayer({
  id: 'zones-fill',
  type: 'fill',
  source: 'zones',
  paint: {
    'fill-color': '#22c55e',
    'fill-opacity': 0.2,
  },
});
```

When your data changes, update the source:

```typescript
const source = map.getSource('zones') as mapboxgl.GeoJSONSource;
source.setData(nextGeoJSON);
```

That **add source → add layer → setData** loop is the backbone of real-time maps.

**Visual idea:** A simple stack diagram: one “GeoJSON source” box feeding two layer boxes (“fill” and “line”) with different colors.

---

## Source types you will actually use

Names matter when you read examples:

- **`geojson`** – your features, your schema; great for zones, routes, and anything you edit in app code.
- **`vector`** – Mapbox-hosted tiles; building footprints in `composite` are the classic example for extrusions.
- **`raster`** – imagery overlays (weather, scanned maps).
- **`raster-dem`** – elevation for hillshade (painted shading) and terrain (actual height in the scene).

Layers (`fill`, `line`, `circle`, `symbol`, `heatmap`, `fill-extrusion`, …) sit on top of these sources. If a tutorial skips straight to `addLayer`, scroll up: there is almost always a source id hiding in the snippet.

**Visual idea:** Small table – three source types in rows, two example layer types each in columns.

---

## GeoJSON in one minute

GeoJSON is JSON that follows a small spec. For apps you will mostly use:

- **Point** – one coordinate pair `[lng, lat]`.
- **LineString** – an ordered list of coordinates (a path).
- **Polygon** – rings of coordinates; the first ring is the outer boundary and the first and last point must match.

```typescript
const point: GeoJSON.Feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-71.06, 42.36] },
  properties: { name: 'Waypoint 1' },
};
```

**Visual idea:** Sketch Point vs LineString vs Polygon on a napkin – annotate “ring closes” on the polygon.

---

## Markers vs symbol layers

**Markers** are DOM elements you attach at a lng/lat. They are perfect for a handful of interactive pins. They get expensive fast if you have hundreds or thousands of moving objects.

**Symbol (and circle) layers** render on the GPU from a source. They scale to large counts and support data-driven layout (for example rotating an icon from a `heading` property).

Rule of thumb from experience: **markers for a few interactive points; layers for fleets and dense data.**

**Visual idea:** Two thumbnails – ten markers vs one thousand points as a symbol layer (smooth zoom).

---

## 3D on the map without leaving Mapbox

You already have two big levers:

1. **Pitch and terrain** – show the ground in relief; combine with Standard style features where available.
2. **`fill-extrusion` layers** – extrude polygons to a height in meters. Building heights often come from vector tile properties; your own GeoJSON can extrude custom volumes (for example airspace zones).

```typescript
map.addLayer({
  id: 'extruded-volume',
  type: 'fill-extrusion',
  source: 'my-source',
  paint: {
    'fill-extrusion-height': ['get', 'heightMeters'],
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': 0.4,
  },
});
```

For Mapbox Standard styles, there is also a high-level switch that toggles a bundle of 3D content (buildings, landmarks, and similar) – use the style docs for the exact property name and behavior for your version.

**Visual idea:** Before/after: flat polygons vs the same footprints extruded with opacity.

---

## Layer order and events

Layers draw in order – later layers paint **on top** unless you insert relative to another id.

```typescript
map.addLayer(newLayer, 'below-this-layer-id');
```

For interaction, you can listen to the map or to a specific layer:

```typescript
map.on('click', (e) => {
  console.log(e.lngLat);
});

map.on('click', 'zones-fill', (e) => {
  // Feature-specific hit testing when you need it
});
```

**Visual idea:** A vertical list labeled “bottom → top” matching your layer stack in dev tools.

---

## Data-driven styling (expressions)

Layers do not have to use fixed colors. Mapbox **expressions** read feature **properties** so the same layer can encode altitude, status, or category in the paint or layout.

```typescript
map.addLayer({
  id: 'altitude-zones',
  type: 'fill',
  source: 'zones',
  paint: {
    'fill-color': [
      'case',
      ['<', ['get', 'altitude'], 100],
      '#22c55e',
      ['<', ['get', 'altitude'], 400],
      '#eab308',
      '#ef4444',
    ],
    'fill-opacity': 0.35,
  },
});
```

Patterns you will see constantly: **`['get', 'propertyName']`**, **`case`**, and **`interpolate`** for smooth ramps. The investment pays off the first time your PM asks for “green when safe, red when not” without new layers.

**Visual idea:** One layer, three polygons, three colors driven only by a numeric property column.

---

## Real-time updates

**Markers** move with `setLngLat`. **GeoJSON sources** move with `setData`. That is the whole trick for live tracking:

```typescript
function tick() {
  const next = buildGeoJSONFromTelemetry();
  (map.getSource('fleet') as mapboxgl.GeoJSONSource).setData(next);
  requestAnimationFrame(tick);
}
```

Batch work when you can – updating one `FeatureCollection` once per frame beats thousands of tiny edits.

**Visual idea:** Timeline strip showing telemetry → `setData` → map frame.

---

## Terrain (elevation) in one breath

For a shaded globe feel, add a **raster-dem** source and attach **terrain** in `style.load` (exact APIs move between versions – follow the current Mapbox terrain guide). Terrain interacts with pitch: a flat orthographic sheet and a pitched perspective hillshade read as two different products.

**Visual idea:** Same camera position with terrain off vs on.

---

## Performance habits that matter

1. Prefer **layers over markers** when point counts climb past “dozens.”
2. **Remove** sources and layers you no longer need – treat the map like a UI you unmount.
3. **Simplify** geometries for trails; you rarely need every GPS fix.
4. **Cluster** dense point clouds when the user is zoomed out.

None of this is glamorous; it is what keeps a demo smooth on a laptop battery.

---

## Series navigation

**Next:** [Three.js 101](./threejs-101.md) – scene, camera, mesh, renderer.

Also in this series: [Using Three.js in Mapbox](./using-threejs-in-mapbox.md).

---

## References

- [Mapbox GL JS documentation](https://docs.mapbox.com/mapbox-gl-js/guides/) – guides and API reference.
- [Mapbox GL JS `Map#setCamera`](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setcamera) – camera projection and related options (verify names against your version).
- [Mapbox Styles API](https://docs.mapbox.com/api/maps/styles/) – Standard and Standard Satellite style URLs.
- [GeoJSON specification](https://geojson.org/) – geometry types and rules.
- [Mapbox GL JS example: Display buildings in 3D](https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/) – `fill-extrusion` from composite source.
- Tom MacWright, [GeoJSON is widely loved](https://macwright.com/lonlat/) – approachable notes on lng/lat ordering confusion.
- Mapbox blog / developers site – search for “Mapbox GL JS” + “terrain” or “extrusion” for current feature overviews.
