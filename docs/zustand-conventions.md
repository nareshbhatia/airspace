This document describes the conventions for a Zustand **`store/`** directory. Use this layout when a feature’s state is large enough to warrant multiple slices but should stay in one `StoreApi` instance.

Example below uses `MissionMap` as the feature name – substitute your feature prefix.

---

## `store/` layout

```text
store/
  createMissionMapStore.ts    # Merges all slice creators; returns StoreApi<MissionMapStore>
  types/
    MissionMapSliceContracts.ts
    MissionMapDomainTypes.ts
    MissionMapStore.ts
    MissionMapWaypointCreationStore.ts   # optional StoreApi alias
  slices/
    missionsSlice.ts
    deviceChannelsSlice.ts
    dockviewSlice.ts
    /* … one module per domain … */
    stubUtils.ts                         # optional shared helpers between slices
    README.md                            # optional: slice inventory + merge notes
  selectors/
    missionMapFlightStateSelectors.ts
```

| Subfolder / file | Responsibility |
| ---------------- | -------------- |
| **`types/`** | TypeScript only. Defines what the composed store **is**; no `set`/`get`, no React. |
| **`slices/`** | Slice **implementations**: each file exports `create<Domain>Slice` and usually a `<Domain>Slice` interface. |
| **`selectors/`** | Pure functions over `MissionMapStore` (or curried `(id) => (store) => value`). |
| **`createMissionMapStore.ts`** | Spreads slice creators in a fixed order; exports `StoreApi<MissionMapStore>`. |

---

## `store/types/`

### `MissionMapSliceContracts.ts`

- One **`interface`** (or `type`) per slice domain: `MissionMapDeviceChannelsSlice`, `MissionMapMissionsSlice`, etc.
- Describes **fields and methods** that slice contributes to the store (data + actions).
- Imports shared shapes from `MissionMapDomainTypes.ts` and, when needed, types from `../slices/` (e.g. `Pick<MissionsSlice, "missions" | "upsertMission">`).
- Does **not** contain runtime logic.

### `MissionMapDomainTypes.ts`

- Cross-slice value types: param objects, pending-update records, enums used in contracts.
- Keeps contract interfaces short and stable.

### `MissionMapStore.ts`

- **Composed store type** = intersection of all slice contracts:

```ts
export type MissionMapStore = MissionMapDeviceChannelsSlice &
  MissionMapDockviewSlice &
  MissionMapWaypointTrajectorySlice &
  /* … */;
```

- Re-exports contract and domain types for consumers.
- **Derived types** from the store shape when useful:

```ts
export type MissionMapMissionEntry = NonNullable<MissionMapStore["missions"][string]>;
```

### `MissionMapWaypointCreationStore.ts` (optional)

- Type alias when callers need the API object, not the state snapshot:

```ts
export type MissionMapWaypointCreationStore = StoreApi<MissionMapStore>;
```

---

## `store/slices/`

One module per domain. Typical exports:

- `<Domain>Slice` — interface for that slice’s keys.
- `create<Domain>Slice` — `StateCreator` factory merged in `createMissionMapStore`.
- Optional pure helpers (e.g. `getNodeIndexMap`) used inside the slice.

### File naming

- **`missionsSlice.ts`** ↔ `createMissionsSlice`, `MissionsSlice` (camelCase file, `create` + `Slice` on the export).
- PascalCase is reserved for **`store/types/`** files named after the primary type (`MissionMapStore.ts`).

### `StateCreator` typing

**Slice only touches its own keys** — generic is the slice interface four times:

```ts
export const createMissionsSlice: StateCreator<MissionsSlice, [], [], MissionsSlice> = set => ({
  missions: {},
  upsertMission: ({ mission, nodeIndexMap, simulationResult }) => { /* … */ },
  /* … */
});
```

**Slice reads or coordinates with the full store** — first generic is the **composed** store; last generic is the **slice contribution**:

```ts
export const createGetMostUpdatedMissionDetailsSlice: StateCreator<
  MissionMapStore,
  [],
  [],
  MissionMapMissionResolutionSlice
> = (_set, get) => ({
  getMostUpdatedMissionDetails: missionId => {
    const pending = get().missionUpdates[missionId];
    /* … */
  },
});
```

Use a type assertion on the return value when the implementation is valid but TypeScript cannot prove the contract (`as MissionMapDeviceChannelsSlice`).

### Merge order in `createMissionMapStore`

Order matters when a slice calls **`get()`** on state defined by earlier slices. Document the order in `slices/README.md` and keep factory spreads aligned.

Typical sequence:

1. Infrastructure slices (channels, layout, trajectory, …).
2. Core entity slices (missions catalog, maps, …).
3. **Resolver / aggregate slices last** (functions that merge or pick “latest” across earlier slices).

### `stubUtils.ts`

Shared no-ops or constants used by multiple slice modules (e.g. `noopSubscribe`). Not a slice; no `create*Slice`.

---

## `store/selectors/`

- **No React**, no `useStore` — only logic.
- Input is **`MissionMapStore`** (the state object) or a selector function **`(store: MissionMapStore) => T`**.
- Use for derived/read logic reused across components (flight state, flags, filtered lists).

```ts
export const getVehicleFlightStateFromMissionMapStore = (
  store: MissionMapStore,
  vehicleId: string
) => { /* … */ };

export const createIsVehicleReturningSelector =
  (vehicleId: string) => (store: MissionMapStore) => { /* … */ };
```

Curried factories (`create…Selector(id)`) give a stable function reference per id for `useStore(api, selector)`.

---

## `createMissionMapStore.ts`

- Lives at **`store/`** root (sibling of `types/`, `slices/`, `selectors/`).
- Imports all `create*Slice` from `./slices/…` and `MissionMapStore` from `./types/MissionMapStore`.
- Returns **`StoreApi<MissionMapStore>`**.

```ts
import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand";

export function createMissionMapStore(
  options: CreateMissionMapStoreOptions
): StoreApi<MissionMapStore> {
  return createStore<MissionMapStore>((set, get, api) => ({
    ...createDeviceChannelsSlice(set as never, get as never, api as never),
    ...createDockviewSlice(set as never, get as never, api as never),
  /* … documented order … */
    ...createGetMostUpdatedMissionDetailsSlice(set as never, get as never, api as never),
  }) as MissionMapStore);
}
```

### Composition casts

Slice creators may use different `StateCreator` first-type parameters (`MissionsSlice` vs `MissionMapStore`). At merge time:

- Pass **`set as never`, `get as never`, `api as never`** into each creator.
- Assert the merged object **`as MissionMapStore`**.

### Options type

```ts
export type CreateMissionMapStoreOptions = {
  mode: MissionMapRuntimeMode; // or other factory inputs
};
```

Keep IO and environment wiring inside slice implementations or callers; the factory only composes slices.

---

## Naming summary

| Item | Pattern |
|------|---------|
| Composed state | `<Feature>Store` |
| Slice contract | `<Feature><Domain>Slice` |
| Slice module | `<domain>Slice.ts` |
| Slice factory | `create<Domain>Slice` |
| Store factory | `create<Feature>Store` |
| Contract types dir | `store/types/*.ts` (PascalCase = main export) |

**`<Feature>Store`** is the type passed to `createStore<…>` and to selectors. It includes **state fields and action methods** on one object.

Avoid `*StoreState` for that type unless you separately use `*Store` for `ReturnType<typeof createFeatureStore>`.

---

## Adding a new slice

1. Add **`MissionMap<Domain>Slice`** in `store/types/MissionMapSliceContracts.ts`.
2. Add it to the **`MissionMapStore`** intersection in `store/types/MissionMapStore.ts`.
3. Add **`store/slices/<domain>Slice.ts`** with `create<Domain>Slice`.
4. Spread the creator in **`createMissionMapStore.ts`** in the correct order (after any slices it reads via `get()`).
5. Add **`store/selectors/`** helpers if multiple consumers need the same derived value.

---

## Anti-patterns

- Putting slice **implementations** in `store/types/` (types stay declarative).
- Putting **React** hooks or context inside `store/` (keep those beside the feature, consuming `StoreApi<MissionMapStore>`).
- Merging slices in **arbitrary order** when later slices use `get()` on earlier state.
- Duplicating derived logic in components instead of **`store/selectors/`**.
- Exporting a global singleton store from `store/` when tests need isolated instances — export the **factory** instead.
