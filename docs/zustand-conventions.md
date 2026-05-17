This document describes the conventions for a Zustand **`store/`** directory. Use this layout when a feature’s state is large enough to warrant multiple slices but should stay in **one store instance** per provider tree (see [Store vs StoreApi](#featurestore-vs-storeapifeaturestore)).

Example below uses `MissionMap` as the feature name – substitute your feature prefix.

---

## `store/` layout

```text
store/
  createMissionMapStore.ts    # Merges slice creators; returns bound store (see Store vs StoreApi)
  types/
    MissionMapSliceContracts.ts
    MissionMapDomainTypes.ts
    MissionMapStore.ts
    MissionMapStoreApi.ts                # optional instance type alias (see Store vs StoreApi)
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
| **`createMissionMapStore.ts`** | Spreads slice creators in a fixed order; factory returns a bound store; context holds the store instance (typed via `MissionMapStoreApi`). |

Feature React hooks live under **`hooks/`** (see [React hooks](#react-hooks)), not inside the feature `store/` directory.

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

### `MissionMapStoreApi.ts` (optional)

- Type alias for the store **instance** returned by `createMissionMapStore()` (context, services, `useStore(api, …)`). See [Store vs StoreApi](#featurestore-vs-storeapifeaturestore) below.

**Prefer `ReturnType<typeof createMissionMapStore>`** when the production factory uses middleware (especially `subscribeWithSelector`). Plain `StoreApi<MissionMapStore>` is enough for docs and simple cases; it does not include the two-argument `subscribe(selector, listener)` overload.

```ts
import type { createMissionMapStore } from "../createMissionMapStore";

export type MissionMapStoreApi = ReturnType<typeof createMissionMapStore>;
```

---

## `<Feature>Store` vs `StoreApi<FeatureStore>`

Zustand uses two related types. Do not confuse them.

| Type | What it is | Use it for |
| ---- | ---------- | ---------- |
| **`<Feature>Store`** | Shape of **`getState()`** — state fields and action methods on one object | `create<FeatureStore>()`, selectors `(store: FeatureStore) => T`, slice contracts |
| **`StoreApi<FeatureStore>`** | Minimal store **instance** API — `getState`, `setState`, `subscribe(listener)`, … | Conceptual typing; vanilla `createStore` |
| **`<Feature>StoreApi`** (alias) | **Actual** instance from `create<FeatureStore>()` — bound store + middleware (e.g. `subscribe(selector, listener)`) | React context, `useStore(api, selector)`, service injection |

```text
MissionMapStoreApi (instance)     ←  provider, DroneServiceImpl, useStore
    │
    ├─ getState() → MissionMapStore   ←  snapshot (selectors, render logic)
    └─ setState / subscribe(selector, listener)
```

**Factory return type:** `createMissionMapStore()` uses `create<MissionMapStore>()(…)` and returns a **bound store** (`UseBoundStore`): it extends `StoreApi<MissionMapStore>` and is callable as a React hook. Type the instance as **`ReturnType<typeof createMissionMapStore>`** (exported as **`MissionMapStoreApi`**), not as `MissionMapStore`.

**Selectors** take **`MissionMapStore`** (the result of `getState()`), not the store instance type.

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

Production slice creators use an **`ImmerStateCreator<MissionMapStore>`** (or `<Feature>StateCreator`) matching the middleware stack in [createMissionMapStore.ts](#createmissionmapstorets)—see that section. The plain `StateCreator` examples below illustrate slice-only vs full-store coordination; they are **not** the production typing when using immer + `subscribeWithSelector`.

**Slice only touches its own keys** — generic is the slice interface four times (plain stack):

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

Lives at **`store/`** root. Imports `create*Slice` from `./slices/…` and `MissionMapStore` from `./types/MissionMapStore`.

`createMissionMapStore()` uses `create` from `zustand` with four middlewares (outer → inner):

1. **`devtools`** — Redux DevTools name / session options  
2. **`persist`** — partial hydration (e.g. URL or `localStorage` options)  
3. **`subscribeWithSelector`** — granular `subscribe(selector)`  
4. **`immer`** — immutable updates via draft `set` in slices  

```ts
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createDeviceChannelsSlice } from "./slices/deviceChannelsSlice";
/* … other slices … */

import type { MissionMapStore } from "./types/MissionMapStore";

export const createMissionMapStore = () => {
  // Bound store (MissionMapStoreApi): StoreApi + subscribeWithSelector + React hook
  return create<MissionMapStore>()(
    devtools(
      persist(
        subscribeWithSelector(
          immer((set, get, store) => ({
            ...createDeviceChannelsSlice(set, get, store),
            ...createDockviewSlice(set, get, store),
            /* … documented merge order … */
            ...createGetMostUpdatedMissionDetailsSlice(set, get, store),
          }))
        ),
        persistOptions // e.g. partialize, storage, skip hydration
      ),
      { name: "feature-store", autoPause: true, maxAge: 1 }
    )
  );
};
```

**Slice merge order:** spread creators inside the `immer(...)` callback. Slices that call `get()` on other slices must be merged **after** those slices (document order in `slices/README.md`).

**Slice typing with middleware:** use an `ImmerStateCreator<MissionMapStore>` (or project `MyAppStateCreator`) so `set` / `get` / `store` match the immer + subscribeWithSelector stack—pass them through to each `create*Slice` **without** `as never`.

**Persist / devtools:** keep `persistOptions` and devtools `{ name }` next to the factory; omit `persist` only when the feature truly has nothing to hydrate (some stores use `devtools` → `subscribeWithSelector` → `immer` only).

**Lightweight test / Storybook factories** may use `createStore` from `zustand/vanilla` with no middleware and `set as never` casts when slice generics differ; however production app stores should use the stack above.

---

## React hooks

- **Naming** (one primary export per file; always prefix with the feature name):
  - `use<Feature>Store` — subscribe to state for rendering; pass a selector `(state) => value`.
  - `use<Feature>StoreApi` — return the Zustand API (`getState`, `subscribe`) for effects, not for JSX.
  - `use<Feature><Domain>` — encode one repeated read/merge rule (often `useFeatureStore` + `useMemo`).
- **Provider required:** Hooks read the store **instance** from context (typed as `<Feature>StoreApi`). `use<Feature>Store` **throws** if the provider is missing; `use<Feature>StoreApi` may return `null` when effects should no-op.
- **Selectors:** Pure, minimal slices of `FeatureStore`. Reuse curried factories from `store/selectors/` for stable per-id selectors. Put shared merge/project logic in a derived hook (`useMemo`) or in `store/selectors/`, not duplicated in components.
- **Non-store context:** Commands, runtime mode, and similar props get their own context + `use<Feature>…` hook. Optional values (e.g. commands) return `null`; callers must null-check.
- **Side effects:** Use `use<Feature>StoreApi` + `useEffect` for `subscribe` / channel registration; always return cleanup. Prefer `use<Feature>Store` when render only needs the latest value.
- **Don’t:**
  - create a store in a hook
  - select the whole store
  - put hooks under `store/`.

**Examples**

```ts
// 1. use<Feature>Store — render from state
export function useMissionMapStore<T>(selector: (state: MissionMapStore) => T): T {
  const api = useContext(missionMapStoreContext);
  if (!api) throw new Error("useMissionMapStore must be used within MissionMapProvider");
  return useStore(api, selector);
}
const mission = useMissionMapStore(s => (missionId ? s.missions[missionId] : undefined));

// 2. use<Feature>StoreApi — imperative / effects (may return null outside provider)
export function useMissionMapStoreApi(): MissionMapStoreApi | null {
  return useContext(missionMapStoreContext);
}
useEffect(() => {
  if (!storeApi) return;
  const sync = () => {
    /* read storeApi.getState(), update map / channel, etc. */
  };
  sync();
  // subscribeWithSelector: subscribe(selector, listener)
  return storeApi.subscribe(
    (state) => state.deviceChannels[droneId],
    sync,
  );
}, [storeApi, droneId]);

// 3. use<Feature><Domain> — derived hook wrapping store reads
export function useMissionMapMissionSpec(missionId: string | null | undefined) {
  const pending = useMissionMapStore(s => (missionId ? s.missionUpdates[missionId] : undefined));
  const entry = useMissionMapStore(s => (missionId ? s.missions[missionId] : undefined));
  return useMemo(() => /* merge pending tail vs entry */, [missionId, pending, entry]);
}
```

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

**`<Feature>Store`** is the generic passed to `create<FeatureStore>()` and to selectors. It includes **state fields and action methods** on one object.

Production factories use **`create<FeatureStore>()`**, not `createStore` from `zustand/vanilla` (vanilla is for lightweight test factories only).

**Instance type:** `export type MissionMapStoreApi = ReturnType<typeof createMissionMapStore>` in `types/MissionMapStoreApi.ts`. Use that alias in context, services, and `use<Feature>StoreApi`—not `StoreApi<MissionMapStore>` alone when middleware augments `subscribe`.

**Composed snapshot type:** use **`<Feature>Store`** for selectors and `getState()`. Avoid `*StoreState` for that shape unless you need a separate name for the instance.

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
- Putting **React** hooks or context inside the feature `store/` directory — keep hooks in **`hooks/`**, consuming `<Feature>StoreApi` from the provider.
- Merging slices in **arbitrary order** when later slices use `get()` on earlier state.
- Duplicating derived logic in components instead of **`store/selectors/`**.
- Exporting a global singleton store from `store/` when tests need isolated instances — export the **factory** instead.
