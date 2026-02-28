# Mapbox library

Modular React hooks and provider for building mission-critical Mapbox GL
applications. The API follows Mapbox best practices so you can compose complex
maps from reusable pieces.

## Structure

- **`providers/`** — `MapContext` and `MapProvider` (map creation and context).
- **`hooks/`** — `useMap`, `useControl`, `useDraw`, `useMapLayer`,
  `useMapEvent`, `useFlyTo`, `useFitBounds`.
- **`types/`** — shared types (e.g. `LngLat`).
- **`index.ts`** — public API; import from `lib/mapbox`.

## Design

- **MapProvider** creates the map and exposes it via context only after the
  `load` event (style is ready). Add sources and layers in descendants; do not
  add them before the map is loaded.
- **useMap** gives access to the map instance. It is `undefined` until load;
  always guard before use.
- **useControl** / **useMapLayer** / **useMapEvent** / **useFlyTo** /
  **useFitBounds** / **useDraw** are modular hooks that manage lifecycle and
  cleanup. Use them together to build layers, controls, and interactions without
  manual add/remove.
- **Error handling**: MapProvider subscribes to map `error` events. Use the
  optional `onError` prop to log or report runtime errors (e.g. tile failures).
  Initial creation failures are shown in the default error UI.

## Usage

Wrap your map tree in `MapProvider`, then use the hooks inside:

```tsx
<MapProvider center={[-122.4, 37.8]} zoom={10} onError={(e) => logToService(e)}>
  <FlightLayer />
</MapProvider>
```

See each hook’s JSDoc for parameters and examples.
