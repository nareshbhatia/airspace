# Navigate

The **Navigate** route shows a full-screen Mapbox map and lets you fly to a
selected airport.

## Components

- **NavigatePage** — Route component: owns `selectedAirportId` state, renders
  `MapProvider`, `FlyToAirport`, and `ButtonPanel`.
- **ButtonPanel** — Renders the airport buttons and calls
  `onAirportSelect(airportId)` on click.
- **FlyToAirport** — Consumes `airportId` and calls `useFlyTo` with that
  airport’s coordinates (or `undefined` when none selected).
- **airports** / **airportById** — Static list of airports (id, name,
  coordinates) and a lookup map.
