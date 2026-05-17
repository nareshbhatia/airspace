# DroneStore slices

## Merge order (`createDroneStore.ts`)

1. **`dronesSlice`** — fleet Map and internal `_update*` / `_clearDrones`
2. **`selectionSlice`** — `selectedDroneId` and `selectDrone`

Selection does not call `get()` on fleet state today. If cross-slice behavior is added (e.g. clear selection when a drone is removed), keep selection **after** drones and type the creator with `DroneStoreStateCreator<DroneStoreSelectionSlice>`.

## Public vs internal

| Method                          | Slice     | Caller             |
| ------------------------------- | --------- | ------------------ |
| `selectDrone`                   | selection | React components   |
| `_updateDrones`, `_clearDrones` | drones    | `DroneServiceImpl` |
