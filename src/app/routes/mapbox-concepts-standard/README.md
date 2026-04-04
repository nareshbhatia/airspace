# Mapbox Concepts – Standard Style

## Purpose

A dedicated page for learning Mapbox 3D rendering. The page is static — no
telemetry, no services, no RxJS. Its goal is to understand how to compose a
production-grade 3D operator scene purely from Mapbox layer primitives.

The scene includes a pitched satellite map with 3D buildings, translucent
airspace zone volumes, vertical asset markers, and a numbered waypoint route.
Each visual element is a distinct Mapbox layer type. This page builds each one
in isolation, then together.

---

## What Mapbox 3D Actually Is

Before any code, the key conceptual shift: Mapbox is not a 2D map library that
can optionally do 3D. It is a WebGL renderer that happens to render geographic
tiles. Everything it draws — tiles, polygons, lines, symbols — is rendered on a
GPU. Pitching the camera to 45° costs nothing extra. Extruding polygons into 3D
volumes is a native layer type, not a hack.

A 3D operator scene of this kind is composed of exactly these Mapbox layer
types:

| Visual Element        | Mapbox Layer Type       | Data Source                      |
| --------------------- | ----------------------- | -------------------------------- |
| Satellite imagery     | Raster tiles (built-in) | Mapbox satellite                 |
| 3D buildings          | `fill-extrusion`        | Mapbox `composite` vector source |
| Airspace zone volumes | `fill-extrusion`        | Custom GeoJSON                   |
| Pole markers          | `fill-extrusion`        | Custom GeoJSON                   |
| Route                 | `line`                  | Custom GeoJSON                   |
| Waypoint markers      | `symbol`                | Custom GeoJSON                   |
| Drone marker          | `symbol`                | Custom GeoJSON                   |

No Three.js. No custom WebGL. Every element is a standard Mapbox layer
configured with the right paint properties.

---

## Part 1: Camera — Pitch and Bearing

The entire 3D effect starts here. A standard map has `pitch: 0` (top-down) and
`bearing: 0` (north up). A useful starting point for a 3D operator scene is
approximately `pitch: 50` with a slight bearing rotation to reveal depth between
buildings and zones.

```typescript
const map = new mapboxgl.Map({
  container,
  style: 'mapbox://styles/mapbox/satellite-streets-v12', // satellite base
  center: [-71.05, 42.36], // Boston area
  zoom: 15,
  pitch: 50, // 0 = top-down, 90 = horizon
  bearing: -20, // degrees clockwise from north
  antialias: true, // required for clean fill-extrusion edges
});
```

**`antialias: true`** must be set at construction time. It cannot be changed
later. Without it, extruded polygon edges are jagged, especially on retina
displays. Always set this when building 3D scenes.

**Pitch vs bearing:**

- `pitch` tilts the camera toward the horizon — this is what makes the scene
  look 3D. Values between 40–60 are typical for operator interfaces.
- `bearing` rotates the compass heading. Rotating slightly (−10 to −30 degrees)
  reveals the depth between parallel structures like building rows or zone
  walls.

---

## Part 2: 3D Buildings

Extruded buildings are the most impactful single addition to a 3D scene.
Mapbox's `composite` source — a vector tileset bundled with every Mapbox style —
includes building footprints and heights from OpenStreetMap.

```typescript
map.on('load', () => {
  // Find the first symbol layer in the style so we can insert buildings below it.
  // This keeps street labels and POI icons rendered on top of building volumes.
  const layers = map.getStyle().layers;
  const firstSymbolLayer = layers.find(
    (l) => l.type === 'symbol' && (l.layout as any)?.['text-field'],
  );

  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#2a2a3e', // dark navy, fits dark operator theme
        'fill-extrusion-height': ['get', 'height'], // OSM building height in meters
        'fill-extrusion-base': ['get', 'min_height'], // for buildings with setbacks
        'fill-extrusion-opacity': 0.75,
        'fill-extrusion-ambient-occlusion-intensity': 0.4, // depth shading
        'fill-extrusion-ambient-occlusion-radius': 3,
      },
    },
    firstSymbolLayer?.id, // insert below labels
  );
});
```

**Understanding the paint properties:**

`fill-extrusion-height` is the top of the extrusion in meters above ground. The
expression `['get', 'height']` reads the `height` property from each building
feature in the vector tileset — these are real building heights from
OpenStreetMap contributors.

`fill-extrusion-base` is the bottom of the extrusion. Most buildings sit at
ground level (base = 0), but buildings with podiums or hillside foundations have
a non-zero `min_height`. Using `['get', 'min_height']` handles these correctly.

`fill-extrusion-ambient-occlusion-intensity` adds subtle shadow shading to the
vertical faces where buildings meet the ground and where walls meet. This single
property dramatically improves depth perception — it is the difference between
flat grey boxes and recognizable buildings.

`minzoom: 14` — OSM building data is only present in the vector tiles at zoom 14
and above. Below that, the layer renders nothing. This is correct behavior.

---

## Part 3: Airspace Zone Volumes

Translucent 3D boxes representing airspace volumes are the most visually
distinctive element of a drone operator interface. They represent restricted
zones, advisory zones, or mission boundaries — defined by a polygon footprint
with per-vertex floor AGL and a constant ceiling height above that floor.

These are `fill-extrusion` layers on custom GeoJSON data. The key difference
from buildings: `fill-extrusion-height` and `fill-extrusion-base` represent
altitude above ground level, not building height. Mapbox uses one base and one
top per layer; sloped floors are approximated by extruding from the minimum
floor AGL to the maximum ceiling AGL across vertices (see `scene3d.ts`).

### The Data Model

```typescript
interface AirspaceZoneFootprintPoint {
  lng: number;
  lat: number;
  floorMetersAgl: number;
}

interface AirspaceZone {
  id: string;
  name: string;
  type: 'restricted' | 'advisory' | 'mission';
  color: string;
  opacity: number;
  ceilingHeightM: number; // ceiling height above the floor at each vertex (m)
  footprint: AirspaceZoneFootprintPoint[]; // closed ring
}

// Sample data — Boston area matching the page location
const airspaceZones: AirspaceZone[] = [
  {
    id: 'restricted-north',
    name: 'Restricted Zone North',
    type: 'restricted',
    color: '#f97316', // orange
    opacity: 0.2,
    ceilingHeightM: 150,
    footprint: [
      { lng: -71.035, lat: 42.375, floorMetersAgl: 0 },
      { lng: -71.01, lat: 42.375, floorMetersAgl: 0 },
      { lng: -71.01, lat: 42.36, floorMetersAgl: 0 },
      { lng: -71.035, lat: 42.36, floorMetersAgl: 0 },
      { lng: -71.035, lat: 42.375, floorMetersAgl: 0 },
    ],
  },
  {
    id: 'advisory-south',
    name: 'Advisory Zone South',
    type: 'advisory',
    color: '#22c55e', // green
    opacity: 0.15,
    ceilingHeightM: 150,
    footprint: [
      { lng: -71.06, lat: 42.365, floorMetersAgl: 50 },
      { lng: -71.04, lat: 42.365, floorMetersAgl: 50 },
      { lng: -71.04, lat: 42.35, floorMetersAgl: 50 },
      { lng: -71.06, lat: 42.35, floorMetersAgl: 50 },
      { lng: -71.06, lat: 42.365, floorMetersAgl: 50 },
    ],
  },
  {
    id: 'mission-boundary',
    name: 'Mission Boundary',
    type: 'mission',
    color: '#3b82f6', // blue
    opacity: 0.12,
    ceilingHeightM: 120,
    footprint: [
      { lng: -71.05, lat: 42.37, floorMetersAgl: 0 },
      { lng: -71.025, lat: 42.37, floorMetersAgl: 0 },
      { lng: -71.025, lat: 42.355, floorMetersAgl: 0 },
      { lng: -71.05, lat: 42.355, floorMetersAgl: 0 },
      { lng: -71.05, lat: 42.37, floorMetersAgl: 0 },
    ],
  },
];
```

### Adding Zone Layers

Each zone type gets its own layer so they can be toggled independently:

```typescript
function addZones(map: mapboxgl.Map, zones: AirspaceZone[]) {
  map.addSource('airspace-zones', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: zones.map((zone) => {
        const floorMin = Math.min(
          ...zone.footprint.map((p) => p.floorMetersAgl),
        );
        const ceilingTop = Math.max(
          ...zone.footprint.map((p) => p.floorMetersAgl + zone.ceilingHeightM),
        );
        const ring = zone.footprint.map((p) => [p.lng, p.lat]);
        return {
          type: 'Feature',
          properties: {
            id: zone.id,
            name: zone.name,
            type: zone.type,
            color: zone.color,
            opacity: zone.opacity,
            floorMin,
            ceilingTop,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [ring],
          },
        };
      }),
    },
  });

  map.addLayer({
    id: 'airspace-zone-volumes',
    type: 'fill-extrusion',
    source: 'airspace-zones',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-base': ['get', 'floorMin'],
      'fill-extrusion-height': ['get', 'ceilingTop'],
      'fill-extrusion-opacity': ['get', 'opacity'],
    },
  });
}
```

**The opacity is everything.** Zones at `opacity: 0.15–0.25` are translucent
enough that you can see buildings, poles, and map features through them while
still reading their volume clearly. Above ~0.4 they become opaque boxes that
obscure everything inside; below ~0.1 they disappear. The range 0.15–0.25 is the
sweet spot for operator interfaces.

**Floor vs ceiling:** At each footprint vertex, ceiling AGL is
`floorMetersAgl + ceilingHeightM`. For rendering, `fill-extrusion-base` is the
minimum floor AGL and `fill-extrusion-height` is the maximum ceiling AGL (top of
the volume). The zone can float above the ground; sloped floors use a single
bounding extrusion (see above).

---

## Part 4: Pole Markers

Vertical bars at each asset location are an effective way to convey both
position and status at a glance. The bar height represents the pole top for that
asset; color represents status.

These are `fill-extrusion` layers on small polygon footprints — one tiny
rectangle per asset. The rectangle is just large enough to be clickable (~3-5
meters wide) but visually reads as a vertical line at map scale.

### Generating Pole Footprints from Points

```typescript
function pointToSquarePolygon(
  lng: number,
  lat: number,
  widthMeters = 4,
): [number, number][] {
  // Convert meters to approximate degrees at Boston latitude
  const dLat = widthMeters / 111_320;
  const dLng = widthMeters / (111_320 * Math.cos((lat * Math.PI) / 180));

  // Square polygon centered on the point
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat], // close the ring
  ];
}
```

### Sample Pole Data

```typescript
interface Pole {
  id: string;
  label: string; // "Pole 01547"
  lng: number;
  lat: number;
  topMetersAgl: number; // bar is drawn baseMetersAgl → this value
  status: 'nominal' | 'flagged' | 'inspected';
}

const poles: Pole[] = [
  {
    id: 'p01547',
    label: 'Pole 01547',
    lng: -71.042,
    lat: 42.362,
    topMetersAgl: 35,
    status: 'nominal',
  },
  {
    id: 'p01561',
    label: 'Pole 01561',
    lng: -71.038,
    lat: 42.365,
    topMetersAgl: 35,
    status: 'flagged',
  },
  {
    id: 'p01562',
    label: 'Pole 01562',
    lng: -71.033,
    lat: 42.36,
    topMetersAgl: 30,
    status: 'nominal',
  },
  {
    id: 'p01563',
    label: 'Pole 01563',
    lng: -71.028,
    lat: 42.368,
    topMetersAgl: 40,
    status: 'inspected',
  },
  {
    id: 'p01564',
    label: 'Pole 01564',
    lng: -71.022,
    lat: 42.355,
    topMetersAgl: 35,
    status: 'nominal',
  },
];

const STATUS_COLORS = {
  nominal: '#22c55e', // green
  flagged: '#ef4444', // red
  inspected: '#64748b', // grey
};
```

### Adding the Pole Layer

```typescript
function addPoles(map: mapboxgl.Map, poles: Pole[]) {
  map.addSource('poles', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: poles.map((pole) => ({
        type: 'Feature',
        properties: {
          id: pole.id,
          label: pole.label,
          status: pole.status,
          color: STATUS_COLORS[pole.status],
          poleTop: pole.topMetersAgl,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [pointToSquarePolygon(pole.lng, pole.lat)],
        },
      })),
    },
  });

  map.addLayer({
    id: 'pole-markers',
    type: 'fill-extrusion',
    source: 'poles',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'poleTop'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.9,
    },
  });
}
```

### Pole Labels

Pole labels ("Pole 01547") are rendered as `symbol` layers offset slightly from
the pole base. Add a separate symbol layer on the same source to show labels at
the base of each pole:

```typescript
map.addLayer({
  id: 'pole-labels',
  type: 'symbol',
  source: 'poles',
  layout: {
    'text-field': ['get', 'label'],
    'text-size': 11,
    'text-anchor': 'top',
    'text-offset': [0, 0.5],
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#000000',
    'text-halo-width': 1,
  },
});
```

---

## Part 5: Route and Waypoint Markers

A numbered waypoint route shows the planned sequence of locations a drone will
visit during a mission.

### Route Data

```typescript
interface Waypoint {
  sequence: number;
  lng: number;
  lat: number;
  altM: number;
  label: string;
}

// Route connecting the poles in sequence
const route: Waypoint[] = [
  { sequence: 1, lng: -71.042, lat: 42.362, altM: 35, label: '1' },
  { sequence: 2, lng: -71.038, lat: 42.365, altM: 35, label: '2' },
  { sequence: 3, lng: -71.033, lat: 42.36, altM: 30, label: '3' },
  { sequence: 4, lng: -71.028, lat: 42.368, altM: 40, label: '4' },
  { sequence: 5, lng: -71.022, lat: 42.355, altM: 35, label: '5' },
];
```

### Route Line

```typescript
function addRoute(map: mapboxgl.Map, waypoints: Waypoint[]) {
  const coordinates = waypoints.map(wp => [wp.lng, wp.lat])

  // Route line source
  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    },
  })

  // Casing line — slightly wider, darker, drawn first for visual separation
  map.addLayer({
    id:     'route-casing',
    type:   'line',
    source: 'route',
    paint: {
      'line-color': '#1d4ed8',
      'line-width': 5,
      'line-opacity': 0.8,
    },
  })

  // Main line
  map.addLayer({
    id:     'route-line',
    type:   'line',
    source: 'route',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 1,
    },
  })
```

### Waypoint Markers

Each waypoint gets a numbered circular badge. This requires a custom image
registered with Mapbox's `addImage` API — a small canvas-drawn circle with the
sequence number:

```typescript
function createWaypointImage(map: mapboxgl.Map, sequence: number): void {
  const size = 28;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // White circle with blue border
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sequence number
  ctx.fillStyle = '#1d4ed8';
  ctx.font = `bold ${size * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sequence), size / 2, size / 2);

  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage(`waypoint-${sequence}`, imageData);
}
```

Add the waypoint symbol layer using the per-feature sequence to select the
correct image:

```typescript
  // Register images for all waypoints
  waypoints.forEach(wp => createWaypointImage(map, wp.sequence))

  // Waypoint source
  map.addSource('waypoints', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: waypoints.map(wp => ({
        type: 'Feature',
        properties: { sequence: wp.sequence, label: wp.label },
        geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
      })),
    },
  })

  // Waypoint symbol layer
  map.addLayer({
    id:     'waypoint-markers',
    type:   'symbol',
    source: 'waypoints',
    layout: {
      'icon-image':              ['concat', 'waypoint-', ['get', 'sequence']],
      'icon-size':               1,
      'icon-allow-overlap':      true,
      'icon-ignore-placement':   true,
    },
  })
}
```

---

## Part 6: Layer Insertion Order

Layer order determines what renders on top of what. Add layers in this sequence:

```typescript
// 1. Zone volumes first — they are the widest/tallest, should be behind everything
addZones(map, airspaceZones);

// 2. Buildings — above zones so zone transparency shows buildings inside
// (inserted below symbol layers by passing firstSymbolLayer.id as the before parameter)
addBuildings(map);

// 3. Pole markers — above buildings, they should poke through building volumes
addPoles(map, poles);

// 4. Route line — above everything except symbols
addRoute(map, route);

// 5. Waypoint markers and pole labels — symbol layers, always on top
// (already added inside addRoute and addPoles)
```

**Why zones before buildings?** A restricted zone that covers a city block
should show the buildings inside it — not hide them. With opacity 0.20, the zone
tints the buildings orange slightly, giving operators a clear sense of which
structures fall within the restricted area. If buildings were below zones, the
opaque building volumes would obscure the zone boundaries.

---

## Part 7: The Page

The 3D Scene page has a full-viewport Mapbox map — no sidebar, no panels. The
entire page is the map. A minimal overlay in the top-right shows:

- A legend for zone types (colored squares + labels)
- A layer toggle panel (checkboxes to show/hide buildings, zones, poles, route)

The layer toggle is the most educational feature of the page: turning each layer
on and off in isolation makes it immediately clear how each one contributes to
the composite scene. Toggling buildings off reveals the zone volumes beneath.
Toggling zones off shows how the base satellite imagery looks without the
airspace context.

```typescript
// Layer toggle implementation using setLayoutProperty
function toggleLayer(map: mapboxgl.Map, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}
```

---

## Part 8: File Structure

```
src/
  data/
    scene3d.ts              ← AirspaceZone[], Pole[], Waypoint[] sample data

  lib/
    mapbox/
      utils/scene3d.ts      ← addBuildings, addZones, addPoles,
                               addRoute, createWaypointImage

  routes/
    scene3d/
      Scene3DPage.tsx       ← full-viewport map, initializes all layers on load
      LayerTogglePanel.tsx  ← overlay checkboxes for each layer group
      ZoneLegend.tsx        ← color legend for zone types
```

---

## Part 9: Implementation Steps

| Step                          | What to Build                                                                                                                                                                                                          | What You Learn                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step 1** Camera             | Create `Scene3DPage` with a Mapbox map initialized at `pitch: 50, bearing: -20, antialias: true`, satellite-streets style, centered on Boston at zoom 15. Verify the pitched satellite view renders correctly.         | Pitch, bearing, antialias. The visual impact of these three parameters. Satellite style vs streets style in 3D.                                                             |
| **Step 2** 3D buildings       | Add the `fill-extrusion` buildings layer using the `composite` source. Find the first symbol layer and insert buildings below it. Adjust `fill-extrusion-opacity` and `ambient-occlusion-intensity`.                   | The `composite` source and `building` layer. `fill-extrusion` fundamentals. Layer insertion order relative to symbol layers. The `ambient-occlusion` properties.            |
| **Step 3** Zones              | Add 3 zone volumes from `scene3d.ts`. Experiment with `fill-extrusion-base` and `fill-extrusion-height` — try a zone from 0→120m vs 50→200m and observe the visual difference. Adjust `opacity` between 0.10 and 0.30. | Floor/ceiling altitude model for airspace. `['get', property]` expressions for data-driven paint. How opacity creates the translucent box visual.                           |
| **Step 4** Pole markers       | Add 5 pole markers using `pointToSquarePolygon`. Set heights to `topMetersAgl`. Color by status. Add the label symbol layer.                                                                                           | Generating polygon geometry from point data. `fill-extrusion` as a vertical marker technique. Symbol layers for labels on the same source.                                  |
| **Step 5** Route + waypoints  | Add the route line with casing. Register waypoint images using canvas. Add the waypoint symbol layer.                                                                                                                  | `LineString` GeoJSON. Line casing technique (two lines, different widths). Dynamic image registration with `addImage`. `['concat', ...]` expression for dynamic icon names. |
| **Step 6** Layer toggle panel | Add `LayerTogglePanel` as a map overlay. Each checkbox calls `toggleLayer` for its group. Verify each layer toggles independently.                                                                                     | `setLayoutProperty` for runtime visibility control. The value of seeing each layer in isolation — this makes the composition legible.                                       |

---

## Definition of Done

1. Map renders at `pitch: 50, bearing: -20` with satellite-streets style.
2. 3D buildings appear in the Boston area at zoom 14+, dark with ambient
   occlusion shading.
3. Three airspace zone volumes render as translucent colored boxes at distinct
   altitude ranges — one orange at ground level, one green floating above 50m,
   one blue mission boundary.
4. Five pole markers render as colored vertical bars, heights proportional to
   pole top, color-coded by status.
5. Pole labels ("Pole 01547") appear at the base of each marker.
6. Route renders as a blue line with numbered circular waypoint badges at each
   stop.
7. Layer toggle panel correctly shows/hides each layer group independently.
8. The visual result is a recognizable 3D operator scene: pitched satellite
   base, extruded buildings, floating zone volumes, vertical asset markers, and
   a numbered route.
9. You can explain how `fill-extrusion-base` and `fill-extrusion-height` create
   floating zone volumes vs ground-anchored building extrusions.
10. You can explain why layer insertion order matters and what happens if zones
    are added after buildings.

---

## The Single Most Important Concept

Everything in this page — buildings, zones, poles — uses the same
`fill-extrusion` layer type. The visual differences between a 40-story building,
a translucent airspace volume, and a narrow pole marker all come from three
parameters:

```
fill-extrusion-base    → where the extrusion starts (meters AGL)
fill-extrusion-height  → where the extrusion ends (meters AGL)
fill-extrusion-opacity → how transparent the surface is
```

A building: base=0, height=120, opacity=0.75 → solid dark box A zone: base=50,
height=200, opacity=0.20 → floating translucent volume A pole: base=0,
height=35, opacity=0.90 → narrow colored bar

This is the Mapbox 3D primitive model. Once you understand it, you can look at
any production drone operator interface and immediately decompose every visual
element into its layer architecture.
