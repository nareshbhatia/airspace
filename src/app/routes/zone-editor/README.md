# Zone Editor Requirements

## Purpose

The Zone Editor page demonstrates how to integrate Mapbox GL Draw into a React
application to let users sketch geospatial polygons directly on a map. Users
draw polygons, assign them a type (Mission Boundary, No-Fly Zone, or Restricted
Airspace), and see them rendered with type-driven colors. A sidebar lists all
drawn zones with their properties.

The central architectural concept this page teaches is the separation between
the Draw tool's internal rendering during interaction and your own styled
GeoJSON layer for committed zones. Mapbox Draw handles the drawing UX; your
application owns the final data and its visual representation.

---

## Polygon Types

Three types are supported. Type drives the fill color and label on the map and
in the sidebar.

| Type                | Color | Use Case                                         |
| ------------------- | ----- | ------------------------------------------------ |
| Mission Boundary    | Blue  | Defines the operational area for a drone mission |
| No-Fly Zone         | Red   | Area where flight is prohibited                  |
| Restricted Airspace | Amber | Area with conditional access restrictions        |

A polygon has no default type — the user must assign one after drawing. Until a
type is assigned, the polygon is shown in a neutral gray and the sidebar flags
it as untyped.

---

## Layout

The page uses the same two-panel layout as Traffic: a fixed left sidebar and a
full-height map.

### Left Sidebar (~300px wide, fixed)

**Toolbar Section (top)**

- Three drawing mode buttons, one per polygon type: Mission Boundary / No-Fly
  Zone / Restricted Airspace.
- Clicking a button activates Mapbox Draw in polygon mode and sets the pending
  type for the next zone to be drawn.
- The active mode button is visually highlighted. Only one mode can be active at
  a time.
- A Cancel button appears while a draw is in progress, allowing the user to
  abort without committing the zone.

**Zone List Section (below toolbar)**

- Scrollable list of all committed polygons, ordered by creation time (newest
  first).
- Each zone card shows: type badge (color-coded), area in square kilometers,
  vertex count, and a delete button.
- Selecting a zone card highlights the corresponding polygon on the map and fits
  the map to its bounds.
- If no zones have been drawn yet, show an empty state: "Select a zone type
  above to start drawing."

### Map Panel

Full-height Mapbox map filling the space to the right of the sidebar. Map style:
`mapbox://styles/mapbox/satellite-streets-v12` — satellite imagery gives drawing
context that a plain dark basemap doesn't.

---

## Drawing Interaction

Drawing is powered by `mapbox-gl-draw` via the `useDraw` hook from `lib/mapbox`.

### Workflow

1. User clicks a type button in the sidebar (e.g. No-Fly Zone).
2. Draw mode activates — cursor changes to crosshair, toolbar shows Cancel.
3. User clicks to place polygon vertices on the map.
4. User double-clicks (or clicks the first vertex) to close and commit the
   polygon.
5. On commit, the zone is captured from Draw, assigned the pending type, added
   to local state, and removed from Draw's internal feature set.
6. The committed zone is rendered in the application's own styled GeoJSON layer
   (not Draw's layer).
7. Draw mode resets to inactive.

### Cancel

If the user clicks Cancel during drawing, the in-progress zone is discarded
(`draw.deleteAll()`), draw mode deactivates, and the toolbar returns to its
default state.

### Edit Mode

Clicking a committed polygon on the map activates Mapbox Draw's edit mode for
that shape (`draw.changeMode('direct_select')`), allowing the user to drag
vertices to reshape it. On edit completion (`draw.getAll()`), the updated
geometry replaces the previous version in local state and is removed from Draw
again.

---

## Map Rendering

### Architectural Pattern

Mapbox Draw manages its own internal layers during the drawing and editing
interaction. Once a polygon is committed or an edit is complete, the zone is
removed from Draw and ownership transfers to the application. The application
renders all committed zones in its own GeoJSON source and styled layers. This
separation is intentional — it gives full control over the visual appearance of
committed zones independently of Draw's interaction states.

### Committed Zone Layers

Two layers per shape type are not required — a single GeoJSON source holds all
committed zones, and type-driven color is applied via Mapbox data-driven style
expressions.

**Fill Layer**

- Fill color driven by `type` property: blue / red / amber per type, neutral
  gray for untyped.
- Fill opacity: 0.25 for normal, 0.4 for selected.

**Stroke Layer**

- Line color matches fill color at full opacity.
- Line width: 2px normal, 3px selected.

**No label layer is required** — type is conveyed by color, and detail lives in
the sidebar.

### Selected Zone

When a zone is selected (via sidebar or map click), apply selected styling via
`feature-state` — increased opacity and stroke weight. Do not re-render the
entire GeoJSON source to apply selection.

---

## Zone Properties

Each committed polygon is stored in local state as a typed object:

| Field         | Type                                                                   | Description                                                 |
| ------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| `id`          | `string`                                                               | UUID generated on commit                                    |
| `type`        | `'mission-boundary' \| 'no-fly-zone' \| 'restricted-airspace' \| null` | Polygon type — null until assigned                          |
| `geometry`    | `GeoJSON.Polygon`                                                      | The committed polygon geometry                              |
| `areaSqKm`    | `number`                                                               | Area in square kilometers, computed on commit using Turf.js |
| `vertexCount` | `number`                                                               | Number of vertices                                          |
| `createdAt`   | `Date`                                                                 | Creation timestamp                                          |

### Area Computation

Use **Turf.js** (`@turf/area`) to compute polygon area on commit. Turf is the
standard geospatial utility library for browser-based GeoJSON operations —
lightweight, well-tested, and directly relevant to mission planning contexts
where area calculations matter.

---

## Zone Selection

A zone can be selected by clicking its polygon on the map or its card in the
sidebar. Selection is mutually synced.

**On Selection**

- Apply selected styling via feature-state.
- Highlight the corresponding sidebar card and scroll it into view.
- Fit the map to the zone's bounding box using `useFitBounds` with comfortable
  padding.
- If the zone is selected via map click, also activate edit mode in Mapbox Draw.

**On Deselection**

- Click the map background to deselect.
- Clear feature-state highlight and sidebar selection.
- Exit Draw edit mode if active.

---

## Deletion

Each sidebar zone card has a delete button.

- If the zone being deleted is currently selected, clear selection first.
- Remove from local state.
- If the zone happens to be loaded in Draw (e.g. mid-edit), remove it from Draw
  as well.
- The map layer updates automatically as the GeoJSON source reflects the new
  state.

There is no confirmation dialog — deletion is immediate. Session-only
persistence means there is no permanent data loss risk.

---

## State

All state is local to the Zone Editor page. Zustand refactor comes later.

| Field            | Type               | Description                                                           |
| ---------------- | ------------------ | --------------------------------------------------------------------- |
| `zones`          | `DrawnZone[]`      | All committed polygons, ordered newest first                          |
| `selectedZoneId` | `string \| null`   | ID of the currently selected zone                                     |
| `activeDrawType` | `ZoneType \| null` | The type assigned to the next zone to be drawn; null when not drawing |

---

## Tech Concepts This Page Teaches

**Mapbox GL Draw integration** — adding the Draw control via `useDraw` from
`lib/mapbox`, activating draw modes programmatically, and listening to draw
events (`draw.create`, `draw.update`, `draw.delete`). Understanding Draw's event
lifecycle is non-obvious and worth learning explicitly.

**Draw-to-application data handoff** — the key architectural pattern: capturing
committed features from Draw, removing them from Draw's internal state, and
taking ownership in the application's own GeoJSON layer. This is how real
applications use Mapbox Draw — Draw is the interaction tool, not the data store.

**Data-driven style expressions** — driving fill and stroke color from a GeoJSON
feature's `type` property using Mapbox expression syntax (`match` expression).
This is more powerful than managing separate layers per type and is the correct
pattern for categorized feature rendering.

**Feature state for selection** — applying selected styling via
`map.setFeatureState` without rebuilding the GeoJSON source. Same pattern as
Traffic, reinforced here in a different context.

**Turf.js for geospatial computation** — using `@turf/area` to compute polygon
area on the client. Turf is the standard browser-side geospatial utility library
— worth knowing for any application that works with GeoJSON geometry.

**`useDraw` from lib/mapbox** — the hook that manages the Draw control
lifecycle: mounting, mode changes, and cleanup. Understanding how it wraps
`mapbox-gl-draw` and what it exposes is directly applicable to building drawing
tools in production.

**`useFitBounds` for zone focus** — fitting the map to a polygon's bounding box
on selection, computed from the polygon's coordinate extent. Reinforces the
pattern introduced in Traffic.

---

## Out of Scope

- Lines, points, and circles (polygons only for this page)
- Zone labeling / naming
- Persistence across sessions (session-only)
- Export to GeoJSON or other formats
- Undo/redo
- Snapping or alignment guides
- Multi-select

---

## Implementation Steps

| Step                              | What to Build                                                                                                                                                                                                                                  | What You Learn                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Step 1** Layout Shell           | Two-panel layout: fixed sidebar and full-height map with satellite-streets style. Sidebar shows placeholder toolbar and empty zone list.                                                                                                       | Layout pattern (same as Traffic), satellite basemap setup.                                                                      |
| **Step 2** Draw Tool Integration  | Add `useDraw` from `lib/mapbox`. Wire toolbar buttons to activate `draw_polygon` mode. Confirm Draw activates and the cursor changes. Add Cancel button that calls `draw.deleteAll()` and resets mode.                                         | `useDraw` hook, activating draw modes programmatically, Cancel interaction.                                                     |
| **Step 3** Shape Commit + Handoff | Listen to the `draw.create` event. On commit: capture the feature, assign the pending type, generate a UUID, remove the feature from Draw, add to local `shapes` state. Log the zone to console to verify.                                     | Draw event lifecycle, draw-to-application data handoff, the core architectural pattern of this page.                            |
| **Step 4** Styled GeoJSON Layer   | Render committed zones in a Mapbox GeoJSON source using `useMapLayer`. Apply fill and stroke layers with `match` expression driving color from the `type` property. Verify type colors render correctly.                                       | `useMapLayer` and `setData`, data-driven `match` expressions for categorical color, fill + line layer pair.                     |
| **Step 5** Area Computation       | Install `@turf/area`. Compute area in square kilometers on commit and store in zone state. Display area in the sidebar zone card.                                                                                                              | Turf.js integration, GeoJSON area computation, unit conversion (Turf returns square meters).                                    |
| **Step 6** Sidebar Zone List      | Render the zone list from state. Each card shows type badge, area, vertex count, and delete button. Empty state when no zones exist. Wire delete button to remove from state.                                                                  | Rendering dynamic state in sidebar, delete with state cleanup.                                                                  |
| **Step 7** Zone Selection         | Add click handler on the fill layer. On click: set `selectedZoneId`, apply feature-state highlight, highlight sidebar card, fit map to zone bounds. Deselect on background click. Sync sidebar card click to map selection.                    | Feature-state for selection, `useFitBounds` from polygon bounds, sidebar-map sync — same pattern as Traffic, different context. |
| **Step 8** Edit Mode              | On zone selection (map click), load the zone's geometry back into Draw using `draw.add()` and activate `direct_select` mode. Listen to `draw.update` event — on edit complete, update geometry and recompute area in state, remove from Draw.  | Draw edit mode, `draw.add` / `direct_select`, handling the update event, recomputing derived properties after edit.             |
| **Step 9** Polish + Edge Cases    | Handle deselection during an active edit (exit edit mode cleanly). Handle deleting a zone that is currently being edited. Verify Draw resets correctly on Cancel at each stage. Confirm no orphaned Draw features remain after commit or edit. | Edge case handling in stateful drawing interactions, Draw cleanup discipline.                                                   |

---

## Definition of Done

The Zone Editor page is complete when all of the following are true:

1. Clicking a type button activates polygon draw mode with the correct pending
   type.
2. Drawing and closing a polygon commits it to state with the correct type,
   color, and area.
3. The committed zone disappears from Draw and appears in the application's own
   styled layer.
4. All three type colors render correctly on the map.
5. The sidebar lists all committed zones with type badge, area, and vertex
   count.
6. Selecting a zone via map or sidebar syncs both, applies highlight styling,
   and fits the map to the zone.
7. Clicking a committed zone on the map activates edit mode — vertices are
   draggable and geometry updates on completion.
8. Deleting a zone removes it from both state and the map layer.
9. Cancel during drawing discards the in-progress zone cleanly.
10. No orphaned features remain in Draw after any commit, edit, or cancel
    operation.
