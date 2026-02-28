# Airspace – Traffic Monitor Requirements

> An evolving lab for geospatial and autonomous systems UI.

---

## Purpose

The Traffic Monitor page demonstrates real-time geospatial data rendering in
Mapbox by displaying live aircraft positions around any airport in the world.
The user selects an airport by IATA code, configures a search area size, and
sees all aircraft currently within that area — updated every 10 seconds from the
OpenSky Network API.

The page introduces symbol layers, dynamic GeoJSON updates, clustering, popups,
and flight selection with automatic map fitting — all core patterns in real-time
operator interfaces.

---

## Data Source

### OpenSky Network REST API

The OpenSky Network provides free, anonymous access to live aircraft position
data via a REST API. No API key is required. The API returns state vectors —
snapshots of each aircraft's current position and telemetry — for all aircraft
within a specified bounding box.

**Endpoint**

```
GET https://opensky-network.org/api/states/all?lamin={lat_min}&lomin={lng_min}&lamax={lat_max}&lomax={lng_max}
```

**Aircraft State Vector Fields Used**

| Field                    | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `icao24`                 | Unique transponder ID — used as the aircraft ID                  |
| `callsign`               | Flight number or registration (may be null or empty)             |
| `origin_country`         | Country of aircraft registration                                 |
| `longitude` / `latitude` | Current position (may be null if not broadcasting)               |
| `baro_altitude`          | Barometric altitude in meters — convert to feet for display      |
| `velocity`               | Ground speed in m/s — convert to knots for display               |
| `true_track`             | Heading in degrees clockwise from north — used for icon rotation |
| `vertical_rate`          | Climb/descent rate in m/s — used to infer phase of flight        |

**Rate Limiting**

Anonymous access is limited to one request per 10 seconds. Poll on a fixed
10-second interval. Do not poll while no airport is selected.

> **Data limitation:** OpenSky state vectors contain only live position data.
> Origin and destination airport are not available without authenticated access.
> The search area filter is therefore spatial only — all aircraft within the
> bounding box around the selected airport, regardless of route.

---

## Airport Data

To support selecting any airport in the world by IATA code, the app needs a
static dataset of airports with IATA codes and coordinates. Use the freely
available OurAirports dataset (`ourairports.com/data`), specifically
`airports.csv`. Filter to airports with a non-empty IATA code — approximately
9,000 airports worldwide.

**Fields Needed**

| Field                            | Description                                                |
| -------------------------------- | ---------------------------------------------------------- |
| `iata_code`                      | The user-facing identifier (e.g. BOS, JFK, LHR)            |
| `name`                           | Full airport name                                          |
| `municipality`                   | City                                                       |
| `iso_country`                    | Two-letter country code                                    |
| `latitude_deg` / `longitude_deg` | Coordinates for bounding box computation and map centering |

**Delivery Format**

Pre-process the CSV at build time and export a TypeScript module containing a
typed `Airport[]` array and an `airportById: Map<string, Airport>` keyed by IATA
code for O(1) lookup. Do not fetch the CSV at runtime. The filtered dataset is
approximately 500KB uncompressed, well under 100KB gzipped.

---

## Search Area: Bounding Box

The search area is implemented as a bounding box around the selected airport.
Although the UI presents a radius in miles, the implementation converts this to
a lat/lng bounding box — because the OpenSky API accepts bounding boxes
natively, requiring no additional client-side filtering.

**Conversion Formula**

Given airport coordinates `(lat, lng)` and a radius `R` in miles:

```
lat_min = lat - (R / 69)
lat_max = lat + (R / 69)
lng_min = lng - (R / (69 * cos(lat * π / 180)))
lng_max = lng + (R / (69 * cos(lat * π / 180)))
```

One degree of latitude is approximately 69 miles everywhere. One degree of
longitude varies by latitude — shorter near the poles, full length at the
equator. This approximation is adequate for aviation distances at typical
airport latitudes.

**Radius Options**

| Radius    | Use Case                                               |
| --------- | ------------------------------------------------------ |
| 50 miles  | Approach and departure traffic around a single airport |
| 100 miles | Regional traffic and en-route aircraft (default)       |
| 300 miles | Wide-area view — may return hundreds of aircraft       |

The selected radius persists while the user changes airports.

**Map Display**

Render the bounding box as a subtle rectangle on the map — a Mapbox fill layer
with low opacity fill and a visible stroke — so the user can see the search
area. It should be visually subordinate to the aircraft layer.

---

## Layout

The page uses a two-panel layout: a fixed left sidebar and a full-height map
filling the remaining space.

### Left Sidebar (~300px wide, fixed)

The sidebar contains two sections stacked vertically: Filter at the top, Flight
List below.

**Filter Section**

- **Airport typeahead** — the user types an IATA code, airport name, or city. A
  dropdown shows matching airports from the static dataset. Selecting an airport
  from the dropdown sets it as the active airport.
- **Selected airport display** — once selected, show the airport's IATA code,
  name, and city prominently. Include a clear button that resets the selection,
  stops polling, hides all aircraft, and returns the map to a neutral state.
- **Radius selector** — a segmented control or button group: 50 mi / 100 mi /
  300 mi. Changing the radius recomputes the bounding box, refits the map, and
  triggers a fresh API fetch immediately.
- **Required** — if no airport is selected, the flight list shows an empty state
  ("Select an airport to view traffic") and no aircraft layer is rendered.
  Polling does not run.

**Flight List Section**

- Scrollable list of all aircraft currently within the search area.
- Each flight card shows: callsign (or "Unknown"), altitude in feet, velocity in
  knots, heading in degrees, and a phase-of-flight label (Climbing / Cruising /
  Descending) derived from `vertical_rate`.
- Selected flight card is highlighted.
- Clicking a flight card selects that aircraft — identical behavior to clicking
  its map icon.
- Aircraft count displayed at the top of the list: e.g. "42 aircraft in search
  area".
- List updates on every poll. If the selected aircraft disappears from the feed,
  clear the selection automatically.

### Map Panel

Full-height Mapbox map filling the space to the right of the sidebar. Map style:
`mapbox://styles/mapbox/dark-v11`.

---

## Map Layers

Listed in rendering order, bottom to top.

### 1. Search Area Layer

A Mapbox fill layer rendering the bounding box as a low-opacity rectangle. Fill:
subtle blue tint at ~10% opacity. Stroke: same color at 40% opacity. Updates
when the selected airport or radius changes. Hidden when no airport is selected.

### 2. Airport Marker

A single marker for the selected airport. Show the IATA code as a label beneath
the marker. Hidden when no airport is selected.

### 3. Aircraft Symbol Layer (unclustered)

Custom airplane icon, rotated to each aircraft's `true_track` heading. Visible
only at zoom levels above `clusterMaxZoom`. Selected aircraft rendered larger or
with a highlight ring via feature-state.

### 4. Cluster Circle Layer

Circles representing groups of aircraft at lower zoom levels. Circle size scales
with cluster count using small / medium / large thresholds. Clicking a cluster
zooms to expand it.

### 5. Cluster Count Label Layer

Text labels centered on each cluster circle showing the aircraft count.

---

## Flight Selection

A flight can be selected by clicking its map icon or its sidebar card. Selection
is mutually synced — clicking either updates both.

**On Selection**

- Highlight the aircraft icon on the map via feature-state.
- Highlight the corresponding sidebar card and scroll it into view.
- Show a popup anchored to the aircraft's position: callsign, country, altitude
  (ft), velocity (kts), heading (degrees), phase of flight.
- Fit the map to show both the selected airport and the selected aircraft using
  `useFitBounds`, with comfortable padding so neither point sits at the viewport
  edge.

**On Deselection**

- Click the map background to dismiss. Remove popup, clear highlight, clear
  sidebar selection.
- If the selected aircraft disappears from the next poll, automatically clear
  selection without error.

---

## Map Behavior on Airport Selection

When an airport is selected (or the radius changes), fit the map to the computed
bounding box using `useFitBounds`. This ensures the entire search area is
visible immediately and gives the user a sense of scale before aircraft appear.
Do not merely center on the airport — fitting to the bounding box accounts for
zoom level appropriately.

---

## Status Bar

A compact overlay at the bottom of the map showing:

- **Last updated** — e.g. "Updated 14:32:05"
- **Aircraft count** — e.g. "42 aircraft"
- **Loading indicator** — subtle spinner or pulse while a poll is in-flight
- **Error state** — "Unable to fetch traffic data — retrying" on API failure,
  non-blocking

---

## State

All state is local to the Traffic page for now — Zustand refactor comes later.

| Field                | Type                  | Description                                                             |
| -------------------- | --------------------- | ----------------------------------------------------------------------- |
| `selectedAirportId`  | `string \| null`      | IATA code of the active airport; resolve to `Airport` via `airportById` |
| `radiusMiles`        | `50 \| 100 \| 300`    | Current search area size, default 100                                   |
| `boundingBox`        | `BoundingBox \| null` | Derived from `selectedAirportId` + `radiusMiles`                        |
| `aircraft`           | `Aircraft[]`          | Current live aircraft, replaced on each successful poll                 |
| `selectedAircraftId` | `string \| null`      | `icao24` of the selected aircraft                                       |
| `lastUpdated`        | `Date \| null`        | Timestamp of the last successful API response                           |
| `loading`            | `boolean`             | True while a poll request is in-flight                                  |
| `error`              | `string \| null`      | Last error message, cleared on next successful poll                     |

---

## Tech Concepts This Page Teaches

**Mapbox Symbol Layers** — the right tool for rendering many features at scale.
Unlike the HTML markers used in Navigate, symbol layers are GPU-rendered and
handle hundreds of moving features without DOM overhead. Understanding when to
use markers vs. symbol layers is a fundamental Mapbox architecture decision.

**Dynamic GeoJSON Updates** — calling `setData` on a live source to update
feature positions without removing and re-adding the layer. This is the core
pattern for real-time position updates in operator interfaces.

**Data-Driven Icon Rotation** — using `icon-rotate` as a data-driven style
property keyed to a GeoJSON feature's `true_track` property. This is how
directional symbols reflect real-world orientation — directly relevant to drone
heading indicators.

**Built-In Clustering** — Mapbox's source-level clustering handles zoom-level
expansion automatically. The non-obvious pattern is that clustered and
unclustered features require separate layer definitions from the same source.
Cluster circle size driven by `point_count` is a data-driven expression worth
understanding explicitly.

**Feature State** — using `map.setFeatureState` to apply selected styling to a
specific feature without re-rendering the entire layer. More efficient than
rebuilding GeoJSON data to toggle a selected property — the correct pattern for
interactive selection in production map applications.

**`useFitBounds` for Selection** — fitting the map to show two points
simultaneously (the airport and the selected aircraft). Computing the bounding
box from two coordinates with padding so neither point is clipped at the
viewport edge.

**Popup Lifecycle Management** — creating, positioning, and removing a
`mapboxgl.Popup` in response to layer events and poll updates. Popups require
careful cleanup to avoid duplicates or stale instances across data refreshes.

**Polling and Interval Management** — using `setInterval` inside `useEffect`
with correct dependency management and cleanup on unmount. Polling should only
run when an airport is selected — starting and stopping the interval in response
to selection state changes is a realistic async management pattern.

**Bounding Box Computation** — converting a radius in miles to a lat/lng
bounding box using the cosine correction for longitude. A fundamental geospatial
operation that appears constantly in mission planning and asset query contexts.

**Large Static Dataset Handling** — pre-processing the OurAirports CSV at build
time into a typed TypeScript module with a `Map` for O(1) lookup. Typeahead
search over ~9,000 records without a backend.

---

## Out of Scope

- Zustand state management (refactor comes later)
- Origin / destination filtering (not available in OpenSky anonymous API)
- Flight history trails or path visualization
- WebSocket or server-sent event streaming (polling is sufficient)
- 3D altitude visualization
- Filtering by airline, country, or altitude band

---

## Implementation Steps

Build the page incrementally — each step produces a visible, testable result.
Steps are sequenced so that complexity arrives one layer at a time and the page
is always in a working state.

| Step                                     | What to Build                                                                                                                                                                                          | What You Learn                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Step 1** Layout Shell                  | Two-panel layout: fixed sidebar (~300px) and full-height map. Sidebar shows placeholder content. Map loads with dark-v11 style.                                                                        | Two-panel flex layout with MapProvider, sidebar structure.                                                      |
| **Step 2** Airport Dataset               | Download and pre-process OurAirports CSV. Filter to airports with IATA codes. Export typed `Airport[]` and `airportById` Map.                                                                          | Build-time data processing, typed static datasets, O(1) Map lookup.                                             |
| **Step 3** Airport Typeahead             | Airport search input with dropdown. Matches IATA code, name, and city. Selecting stores `selectedAirportId`. Add clear button.                                                                         | Typeahead over large static dataset, controlled input with dropdown, selection state.                           |
| **Step 4** Bounding Box + Map Fit        | On airport selection, compute bounding box using 100-mile default. Fit map using `useFitBounds`. Render bounding box as fill layer. Add radius selector — recompute and refit on change.               | Bounding box computation, `useFitBounds`, fill layer for area visualization, derived state.                     |
| **Step 5** API Integration + Flight List | Fetch OpenSky once on airport selection. Map state vectors to typed `Aircraft[]`, filtering null positions. Populate sidebar list. Add status bar.                                                     | OpenSky API shape, null filtering, unit conversions, phase-of-flight from `vertical_rate`, loading/error state. |
| **Step 6** Symbol Layer + Custom Icon    | Render aircraft as Mapbox symbol layer using `useMapLayer`. Load custom airplane SVG. Apply `icon-rotate` from `true_track`.                                                                           | `useMapLayer` and `setData`, custom icon loading, data-driven style expressions.                                |
| **Step 7** Live Polling                  | Replace one-shot fetch with `setInterval` every 10 seconds. Start on airport selection, stop on clear. Update layer and sidebar on each poll.                                                          | Conditional interval management, live GeoJSON updates, memory leak prevention.                                  |
| **Step 8** Clustering                    | Enable source-level clustering. Add cluster circle and count label layers. Implement click-to-expand.                                                                                                  | Separate layers for clustered vs unclustered features, `point_count` expression, cluster expansion.             |
| **Step 9** Flight Selection + Popup      | Click handlers on map icon and sidebar card. On selection: feature-state highlight, sidebar sync, popup, `useFitBounds` to airport + aircraft. Deselect on background click or aircraft disappearance. | Feature-state, popup lifecycle, `useFitBounds` with two points, sidebar-map sync.                               |
| **Step 10** Polish + Edge Cases          | Handle null callsigns, aircraft disappearing between polls, state reset on airport clear. Verify no memory leaks on unmount.                                                                           | Defensive real-world data handling, cleanup verification.                                                       |

---

## Definition of Done

The Traffic page is complete when all of the following are true:

1. No airport selected: map shows no aircraft, sidebar shows empty state prompt,
   no polling occurs.
2. Selecting an airport fits the map to the search area and begins polling every
   10 seconds.
3. Radius selector recomputes bounding box, refits map, and triggers a fresh
   fetch.
4. Aircraft render as a custom directional icon rotated to their heading.
5. Clustering is active at low zoom — bubbles show count scaled by size, expand
   on click.
6. Sidebar flight list updates on every poll and shows count, callsign,
   altitude, velocity, and phase of flight.
7. Selecting a flight (map or sidebar) syncs both, shows popup, and fits map to
   airport + aircraft.
8. Deselecting clears popup, highlight, and sidebar selection.
9. If selected aircraft disappears from feed, selection clears automatically.
10. Status bar shows last updated time, aircraft count, loading indicator, and
    error state.
11. No memory leaks on unmount — interval cleared, popup removed, layers cleaned
    up.
