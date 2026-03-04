# Flightpath Requirements

## Purpose

The Flightpath page is the most architecturally significant page in the Airspace
project. It simulates live telemetry from multiple drones — positions updating
at 10 Hz from a recorded stream — and renders them as moving markers on a Mapbox
map. A sidebar lists all active drones; clicking one selects it and flies the
map to it.

But the page is more than a feature demo. It is a deliberate exercise in
building real-time aviation interfaces correctly. The implementation follows the
same architectural principles used in production drone ground control stations:
a Service layer that owns the data pipeline, RxJS for stream composition inside
the Service, and Zustand as the state sink that React components read from.

This document explains not just what to build, but why each architectural
decision was made — and how the chosen architecture improves on the
alternatives.

---

## Part 1: The Three Categories of State

Before discussing architecture, it is essential to understand that not all state
is the same. Real-time aviation applications deal with three fundamentally
different categories, each requiring a different tool.

### Category 1: UI State

State that exists only in the browser. The server has no opinion about it.

**Examples:** which drone is selected, whether a panel is expanded, draw mode in
the Zone Editor, active filter values.

**Characteristics:** Created by user interaction. Never fetched. No loading
states. Safe to lose on reload.

**Right tool: Zustand.** Simple, lightweight, no async concerns.

---

### Category 2: Server Request/Response State

Data that originates on a server, is fetched on demand, may go stale, and is
mutated back via API calls.

**Examples:** saved mission definitions, historical flight logs, user settings,
zone configurations persisted to a database.

**Characteristics:** Has loading/success/error states. Can go stale. Benefits
from caching. Mutations go back to the server.

**Right tool: React Query or SWR.** Built specifically for this lifecycle —
caching, background refetching, deduplication, optimistic updates. GraphQL
queries and mutations (via Apollo Client or urql) fall squarely in this category
as well — they are request/response operations with cacheable results, and
Apollo's normalized cache handles the same staleness and invalidation concerns
that React Query handles for REST.

**Important caveat for operator tools:** This category matters less in drone and
defense applications than in consumer web. Operator interfaces tend to have
fewer independent REST endpoints and more emphasis on the third category. A
client-side cache is most valuable when data goes stale on a timescale where a
cached value is still useful — this rarely applies to mission-critical
telemetry. React Query is worth knowing but may appear lightly in real-time
operator interfaces.

---

### Category 3: Real-Time Streaming State

Data that arrives continuously from an external source — WebSocket, gRPC stream,
MAVLink, pub-sub, SSE, or GraphQL subscriptions. This is the dominant category
in aviation operator interfaces.

GraphQL subscriptions (`graphql-ws`) deserve a specific note: although they use
the same GraphQL schema as queries and mutations, they run over a persistent
WebSocket and push updates continuously. They are streaming state, not
request/response state — React Query and Apollo's query cache do not apply. The
`graphql-ws` subscription produces an Observable-compatible stream that
integrates directly into an RxJS pipeline via `from()`. Treat it exactly as you
would a WebSocket stream.

**Examples:** drone GPS position, altitude, heading, battery level, mission
execution status, behavior tree node states, asset detection results.

**Characteristics:** Pushed from server, not pulled. Always current — the stream
IS the source of truth. Caching is meaningless. High frequency (10 Hz = 10
updates per second per drone). Requires transformation before the UI can use it.
React Query's request/response model does not apply here at all.

**Right tool: RxJS for stream composition, Zustand as the state sink.** This is
the architecture this page implements, explained in detail below.

---

## Part 2: The Flightpath Service Pattern

The Flightpath ground control station (github.com/flightpath-dev/flightpath-ui)
establishes a Service architecture for managing real-time drone telemetry. The
Airspace Flightpath page adopts this pattern directly. Understanding it is
prerequisite to implementing the page.

### The Service Interface

Every service implements a minimal lifecycle contract:

```typescript
// Service.ts
export interface Service {
  onInit: () => void; // called on mount: open connections, start subscriptions
  onDestroy: () => void; // called on unmount: close connections, clean up
}
```

This interface gives the generic `ServiceProvider` everything it needs to manage
any service's lifecycle without knowing anything about the service's internals.
`onInit` and `onDestroy` are the only two moments in a service's life that the
React tree needs to coordinate.

### The MAVLinkService Interface

The service exposes two categories of API — Observables for reading, command
methods for writing:

```typescript
// MAVLinkService.ts (abridged)
export interface MAVLinkService extends Service {
  // Observables — live data streams
  position2D$: Observable<Position2D>;
  telemetry$: Observable<Telemetry>;
  flightStatus$: Observable<FlightStatus>;
  batteryRemaining$: Observable<number>;

  // Command methods — actions on the drone
  sendArmCommand(systemId: number, componentId: number): Promise<void>;
  sendTakeoffCommand(
    systemId: number,
    componentId: number,
    altM: number,
  ): Promise<void>;
  sendReturnToLaunchCommand(
    systemId: number,
    componentId: number,
  ): Promise<void>;
}
```

Two things matter here. First, the interface cleanly separates reads
(Observables) from writes (commands) — an analogy to CQRS. Second, components
and hooks depend on the interface, never the implementation.
`MAVLinkServiceImpl` is never imported by UI code. This enables a mock
implementation to be substituted in tests without changing a single component.

### The Generic ServiceProvider

`ServiceProvider` is a reusable generic component that handles the lifecycle for
any service:

```typescript
// ServiceProvider.tsx
export function ServiceProvider<TService extends Service>({
  serviceContext,
  serviceInstance,
  children,
}: ServiceProviderProps<TService>) {
  useServiceLifecycle(serviceInstance); // calls onInit on mount, onDestroy on unmount
  return (
    <serviceContext.Provider value={serviceInstance}>
      {children}
    </serviceContext.Provider>
  );
}
```

`useServiceLifecycle` uses a `useRef` to capture the instance and a `useEffect`
with an empty dependency array to ensure `onInit` fires exactly once on mount
and `onDestroy` fires exactly once on unmount — regardless of re-renders.

The concrete `MAVLinkServiceProvider` wires it up:

```typescript
// MAVLinkServiceProvider.tsx
export function MAVLinkServiceProvider({ children }) {
  const mavlinkService = useMemo(() => new MAVLinkServiceImpl(), []);
  return (
    <ServiceProvider
      serviceContext={MAVLinkServiceContext}
      serviceInstance={mavlinkService}
    >
      {children}
    </ServiceProvider>
  );
}
```

`useMemo` with an empty dependency array ensures the implementation is
instantiated exactly once. Context makes the instance available to the entire
subtree.

### How Components Consume the Service in Flightpath GCS

`useServices.ts` exposes typed hooks that wrap `observable-hooks`:

```typescript
// useServices.ts (abridged)
export function usePosition2D(): Position2D {
  const mavlinkService = useMAVLinkService();
  return useObservableState(mavlinkService.position2D$, {
    lat: 0,
    lon: 0,
    heading: 0,
  });
}
```

`useObservableState` subscribes the calling component to the Observable and
replicates emissions into React local state. A component consumes live data as:

```typescript
function DroneAltitude() {
  const { mslAltitude } = useTelemetry();
  return <span>{mslAltitude.toFixed(1)} ft</span>;
}
```

The Airspace Flightpath page replaces this bridge with Zustand — the reasons are
explained in Part 3.

### Note on the Map Implementation

The Flightpath GCS uses OpenLayers (`MapView.tsx`), not Mapbox. This is a
deliberate performance choice — OpenLayers handles high-frequency position
updates on a cached Feature geometry efficiently via `setGeometry()` and
`setRotation()`, avoiding full layer redraws on each tick. The Airspace
Flightpath page uses Mapbox (consistent with the rest of Airspace), applying the
equivalent optimization via `setData` on a GeoJSON source rather than rebuilding
layers.

---

## Part 3: Why the Airspace Flightpath Page Differs from Flightpath GCS

The Airspace Flightpath page adopts the Service pattern described above but
makes one deliberate architectural change: instead of bridging RxJS to React via
`observable-hooks`, it bridges RxJS to **Zustand**.

### The Problem with observable-hooks at Scale

`useObservableState` replicates stream state into the calling component's local
React state. This is correct, but has consequences that compound as the
application grows:

**State is not queryable outside subscribers.** You might argue that the RxJS
Observable is itself the single source of truth — and for the _stream_ it is.
But an Observable is a push-only construct: it delivers values to subscribers
when it emits, but it holds no queryable snapshot of the current value. If you
need to know "what is drone Alpha's current position right now?" from a service
method, a test, or a component that isn't currently subscribed, the Observable
cannot answer. Only a `BehaviorSubject` (which retains the last emitted value)
or Zustand (which is a queryable state container) can. The Observable is the
source of truth for the _flow of data over time_; Zustand is the source of truth
for the _current snapshot_. Both have a role — the distinction is whether you
need to query state or just react to it.

**Derived state is recomputed per subscriber.** If three panels each call
`useTelemetry()` and each derives `flightPhase` from `verticalRate`, that
derivation runs three times per tick. With ten drones at 10 Hz it is 100
derivations per second, multiplied by the number of subscribers.

**DevTools visibility is absent.** Component-local React state does not appear
in Redux DevTools. You cannot inspect "what is drone Alpha's current position?"
in the DevTools panel without rendering a component that subscribes to it. This
makes debugging live telemetry issues significantly harder.

**Cross-component state sharing requires Context or prop drilling.** If one
component selects a drone and another needs to know the selection, that state
needs a separate solution — typically React Context, with its own re-render
problems, or Zustand anyway.

### The Solution: RxJS Inside the Service, Zustand as the Sink

Zustand exposes `getState()` as a static method on the vanilla store that works
outside React with no hooks required. A Service pushes into Zustand with a plain
`.subscribe()` call — the entire bridge in one line:

```typescript
droneState$.subscribe((state) => {
  droneStore.getState()._updateDrone(droneId, state);
});
```

The full data flow:

```
Recorded stream / WebSocket / MAVLink
  → DroneService.onMessage() or interval tick
    → RxJS Subject.next()               ← raw data enters the pipeline
      → RxJS operators                  ← throttle, combine, derive
        → .subscribe()                  ← THE BRIDGE (one line, no library)
          → droneStore.getState()       ← state lands here, once
            → useDroneStore() in components ← selective subscriptions
              → React renders           ← only what changed
```

Compared to Flightpath GCS:

```
MAVLink
  → MAVLinkService
    → RxJS Observables
      → observable-hooks bridge         ← per component
        → React local state             ← state lands here, per component
          → React renders
```

The difference is not correctness — both work. The difference is centralization,
debuggability, and scalability. With Zustand as the sink, drone state is
inspectable in DevTools, accessible outside components, computed once, and
shared across the application with zero subscription multiplication.

### Why Keep RxJS At All?

If Zustand is the sink, why not push raw data directly into Zustand and skip
RxJS?

Because RxJS genuinely earns its place for stream composition tasks that are
hard to do cleanly without it. Consider this RxJS pipeline — it combines two
streams, throttles the output, and skips redundant updates:

```typescript
// RxJS version — declarative, ~8 lines
combineLatest([position$, attitude$])
  .pipe(
    throttleTime(100), // cap UI updates at 10/sec regardless of input rate
    distinctUntilChanged(deepEqual), // skip update if nothing meaningful changed
    map(([pos, att]) => ({
      ...pos,
      heading: att.yaw,
      flightPhase: deriveFlightPhase(pos, att),
    })),
  )
  .subscribe((state) => droneStore.getState()._updateDrone(droneId, state));
```

Here is a partial equivalent using `setInterval` — it handles throttling only,
and omits `combineLatest` and `distinctUntilChanged` because those require
substantially more imperative scaffolding:

```typescript
// setInterval equivalent — imperative, ~35 lines, incomplete
let lastPosition: RawPosition | null = null;
let lastAttitude: RawAttitude | null = null;
let lastEmittedState: DroneUpdate | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

function onPositionMessage(pos: RawPosition) {
  lastPosition = pos;
}
function onAttitudeMessage(att: RawAttitude) {
  lastAttitude = att;
}

function startPipeline() {
  // throttleTime(100) — only emit at most every 100ms
  intervalId = setInterval(() => {
    if (!lastPosition || !lastAttitude) return;

    const nextState = {
      lat: lastPosition.lat,
      lng: lastPosition.lng,
      heading: lastAttitude.yaw,
      flightPhase: deriveFlightPhase(lastPosition, lastAttitude),
    };

    // distinctUntilChanged — skip if nothing meaningful changed
    // deepEqual is not built-in; you must import or write it
    if (deepEqual(nextState, lastEmittedState)) return;

    lastEmittedState = nextState;
    droneStore.getState()._updateDrone(droneId, nextState);
  }, 100);
}

function stopPipeline() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  // Must also reset lastPosition, lastAttitude, lastEmittedState
  // to avoid stale values if the pipeline is restarted
  lastPosition = null;
  lastAttitude = null;
  lastEmittedState = null;
}
```

The `setInterval` version is already longer and harder to follow — and it still
omits `combineLatest`'s guarantee that both streams have emitted at least once
before producing output. Adding a third stream, a debounce, or a switchMap would
each require further manual scaffolding. The imperative version also has subtle
bugs: if `stopPipeline` is not called on unmount, the interval runs forever; if
state is not reset on restart, stale values from a previous session contaminate
the next. RxJS handles all of these concerns by construction.

The discipline is keeping RxJS strictly inside the Service — it never leaks into
components or hooks.

---

## Part 4: Full Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                     │
│  Read from Zustand only. Call DroneService for commands.│
│  Zero knowledge of RxJS or stream mechanics.            │
└────────────────────────┬────────────────────────────────┘
                         │ useDroneStore() — selective subscriptions
┌────────────────────────▼────────────────────────────────┐
│               Zustand Vanilla Stores                    │
│  droneStore:    drones Map, selectedDroneId             │
│  playbackStore: isPlaying, elapsedMs, controls          │
│  React hooks are thin wrappers: useDroneStore()         │
└────────────────────────▲────────────────────────────────┘
                         │ droneStore.getState()._setX() — the bridge
┌────────────────────────┴────────────────────────────────┐
│                    DroneService                         │
│  Implements Service (onInit / onDestroy)                │
│  RxJS interval drives 10 Hz playback                    │
│  takeUntil(destroy$) manages all subscription cleanup   │
│  Exposes play / pause / reset commands                  │
└────────────────────────▲────────────────────────────────┘
                         │
              telemetry.json (recorded stream)
              Frames for N drones at 10 Hz
```

---

## Part 5: Vanilla-First Store Design

### Why Vanilla-First

Zustand has two APIs for creating stores: `create` from `zustand`
(React-coupled) and `createStore` from `zustand/vanilla` (React-independent).
Our stores use the vanilla API.

The distinction matters architecturally. A vanilla store is a pure JavaScript
object — it can be read, written, and subscribed to without any React context,
hook, or component in scope. The React hook is then a thin, explicit wrapper
over it. This makes the React-independence of the Service layer a first-class
architectural fact rather than something that happens to work because
`getState()` exists.

```typescript
// droneStore.ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// The vanilla store — importable by Services with no React dependency
export const droneStore = createStore<DroneState>()(
  devtools(
    subscribeWithSelector((set) => ({
      drones: new Map<string, DroneState>(),
      selectedDroneId: undefined,

      selectDrone: (id) => set({ selectedDroneId: id }),

      _updateDrone: (id, update) =>
        set((state) => ({
          drones: new Map(state.drones).set(id, {
            ...state.drones.get(id),
            ...update,
          } as DroneState),
        })),
    })),
    { name: 'DroneStore' },
  ),
);

// The React hook — a thin view-layer wrapper, used only in components
export const useDroneStore = <T>(selector: (state: DroneState) => T): T =>
  useStore(droneStore, selector);
```

`subscribeWithSelector` enables the two-argument
`store.subscribe(selector, listener)` form used later in the Zustand → RxJS
bridge example; without it, `store.subscribe` only accepts a listener.

**The critical rule:** Services import `droneStore` (the vanilla object).
Components import `useDroneStore` (the React hook). These two imports never
cross layers.

### Never Store Observables in Zustand

Zustand state must be plain, serialisable values — strings, numbers, booleans,
arrays, plain objects. Never store an RxJS Observable, Subject, or Subscription
in Zustand state. Doing so breaks DevTools serialisation, creates memory leaks,
and couples the state layer to the RxJS layer in a way that is very hard to
untangle.

```typescript
// ✅ Correct — plain serialisable state
{ lat: 42.36, lng: -71.01, heading: 77 }

// ❌ Never do this
{ position$: Observable<Position2D>, subscription: Subscription }
```

Observables belong in Services. State belongs in Zustand. The bridge is the
`.subscribe()` call that connects them — not a reference stored anywhere.

---

## Part 6: The Two Directions of the RxJS ↔ Zustand Bridge

The bridge between RxJS and Zustand runs in both directions, and understanding
both is essential for building complete operator interfaces.

### Direction 1: Stream → Zustand (Incoming telemetry)

This is the primary direction for this page. Data arrives from an external
source, flows through an RxJS pipeline, and lands in Zustand via `getState()`:

```typescript
// Inside DroneServiceImpl.onInit()
interval(100)
  .pipe(takeUntil(this.destroy$))
  .subscribe((tick) => {
    droneStore.getState()._updateDrone(droneId, frame);
  });
```

### Direction 2: Zustand → RxJS (Outgoing commands / user intent)

The reverse direction is equally important for command flows. When a user action
(selecting a drone, changing a filter, triggering a search) should drive an
asynchronous operation — fetching mission history, querying asset details,
sending a command — the right pattern is an Event Sink:

```typescript
// A Subject captures user intent as an event stream
const droneSelectSubject$ = new Subject<string>()

// RxJS processes it — switchMap cancels the previous request when a new one arrives
droneSelectSubject$.pipe(
  switchMap(droneId => fetchMissionHistory(droneId)), // cancels in-flight request
  takeUntil(this.destroy$)
).subscribe(history => {
  droneStore.getState()._setMissionHistory(history)
})

// The DroneService exposes a command method
selectDrone(droneId: string) {
  droneStore.getState().selectDrone(droneId)  // update UI state immediately
  droneSelectSubject$.next(droneId)           // trigger async pipeline
}
```

The key benefit of `switchMap` here is race condition elimination: if the user
selects drone Alpha, then immediately selects drone Bravo, the Alpha request is
automatically cancelled. Without `switchMap` (using `useEffect` + `fetch`
instead), a slow Alpha response arriving after the Bravo response would
overwrite the correct state. This race condition is common in operator tools
where users switch focus rapidly between entities.

**Note for this page:** The Flightpath page is receive-only — there are no
outgoing command flows beyond playback control. The Event Sink pattern is
documented here for completeness; it becomes essential on the Mission Planner
page.

The Zustand → RxJS direction can also be used to react to state changes with
stream operators. Zustand's `store.subscribe` returns an unsubscribe function
that can be wrapped in an Observable:

```typescript
// Convert a Zustand store slice into an RxJS stream
const selectedDroneId$ = new Observable<string | undefined>((subscriber) => {
  const unsub = droneStore.subscribe(
    (state) => state.selectedDroneId, // selector — requires subscribeWithSelector middleware
    (id) => subscriber.next(id), // listener fires only when selectedDroneId changes
  );
  return () => unsub();
});
```

This pattern is useful when a state change should trigger a multi-step async
operation that benefits from RxJS operators. For simple one-shot fetches a
direct call from a Zustand action is usually sufficient. If you do not use
`subscribeWithSelector`, subscribe to the whole state and manually compare the
previous and next `selectedDroneId` values inside the listener before emitting.

---

## Part 7: Performance — Two Layers of Deduplication

High-frequency streaming applications need deduplication at two distinct points
in the data pipeline. Applying it in only one place leaves unnecessary work on
the table.

### Layer 1: `distinctUntilChanged` in the RxJS Pipeline

This deduplicates before state is written to the store. A redundant emission
never reaches Zustand at all — it is filtered out in the Service layer:

```typescript
position$
  .pipe(
    throttleTime(100),
    distinctUntilChanged((a, b) => a.lat === b.lat && a.lng === b.lng),
  )
  .subscribe((pos) => droneStore.getState()._updateDrone(droneId, pos));
```

At 10 Hz with 5 drones this prevents up to 50 unnecessary store writes per
second in cases where a drone is stationary or its position hasn't changed
meaningfully.

### Layer 2: `shallow` in Zustand Component Selectors

This deduplicates after state is written, preventing a component from
re-rendering when the slice it subscribes to hasn't changed. Even if drone
Alpha's position updates 10 times per second, the `DroneCard` for drone Bravo
should not re-render:

```typescript
// Without shallow — re-renders whenever ANY drone updates (wrong)
const drones = useDroneStore((state) => state.drones);

// With shallow — only re-renders when this drone's specific data changes (correct)
const droneAlpha = useDroneStore((state) => state.drones.get('alpha'), shallow);
```

**The distinction:** `distinctUntilChanged` guards the store write (before).
`shallow` guards the component render (after). Both are necessary. In a 5-drone
system at 10 Hz, without both layers a single telemetry tick could trigger up to
5 store writes and 5 × N component re-renders, where N is the number of
components subscribed to drone state. With both layers, each tick writes exactly
what changed and re-renders only the components whose data actually changed.

---

## Part 8: Subscription Lifecycle — `takeUntil` Pattern

Memory leaks are the most common failure mode when mixing RxJS and long-lived
application state. Because Zustand stores live for the lifetime of the app,
subscriptions that are not properly cleaned up will continue running and writing
to the store after the component tree that initiated them has unmounted.

The `onDestroy` lifecycle method in the Service interface is where cleanup
happens. For services with a single subscription, `subscription.unsubscribe()`
is sufficient. For services with multiple concurrent streams — which is the norm
in operator interfaces — the `takeUntil` pattern is more robust:

```typescript
// DroneServiceImpl.ts
export class DroneServiceImpl implements DroneService {
  // A single destroy signal controls all subscriptions
  private readonly destroy$ = new Subject<void>();

  onInit() {
    // All subscriptions share the same termination signal
    interval(100)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tick) => {
        /* ... playback logic ... */
      });

    // A second stream (e.g. connection health check) is cleaned up automatically
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        /* ... heartbeat check ... */
      });
  }

  onDestroy() {
    // One call terminates all subscriptions simultaneously
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

The advantage over manual subscription tracking is scale: as the number of
streams in a service grows, `takeUntil` requires no additional cleanup code.
Adding a new stream automatically inherits the same teardown behaviour.
`this.destroy$.next()` is the single line that cancels everything.

This pattern is idiomatic RxJS and is the standard approach in production GCS
codebases. It should be used for all services in this project, including
`DroneServiceImpl`.

---

## Part 9: Separation of Concerns — Summary

The architecture is governed by three rules that together enforce a clean
separation between the layers:

**Zustand is for current state — the source of truth.** Stores contain only
plain, serialisable values: strings, numbers, booleans, arrays, plain objects.
No Observables, no Subscriptions, no class instances. State is readable,
inspectable in DevTools, and resettable without side effects.

**RxJS is for state transitions — the orchestration of time.** Stream
composition, throttling, debouncing, combining, and deriving all live inside
Service classes. RxJS operators are never used in components or hooks.
Components have zero knowledge that streams exist.

**The Service is the boundary.** The Service is the only place where RxJS and
Zustand meet. The incoming direction (stream → store) is the `.subscribe()` call
that pushes derived state via `getState()`. The outgoing direction (user intent
→ stream) is a Subject that feeds a pipe and eventually writes back to the
store. Outside the Service, these two worlds are invisible to each other.

Violating these rules in either direction — storing Observables in Zustand, or
using `useObservable` in a component — introduces the coupling that this
architecture is designed to prevent.

---

## Part 10: Command Flow — How Components Send Commands

The data flow from Service → Zustand → Components handles the read side cleanly.
The write side — how components send commands back to the outside world —
requires an equally deliberate answer.

### The Two Options

**Option A: Components call the Service directly**

```typescript
const droneService = useDroneService();
droneService.arm(targetId);
```

**Option B: Components call a Zustand action, which delegates to the Service**

```typescript
const arm = useDroneStore((state) => state.arm);
arm(targetId); // store action internally calls droneService.arm()
```

### Why Option B Is Architecturally Awkward

Zustand stores are instantiated outside the React tree — before any Context
exists. The Service is delivered via React Context (`DroneServiceContext`). A
Zustand action has no access to Context, so routing commands through the store
would require one of:

- Importing the service singleton directly inside the store (breaking the
  Context delivery model and testability), or
- Storing a service reference inside Zustand state (violating the "no class
  instances in state" rule), or
- Some other workaround that adds indirection with no architectural benefit.

Zustand is a state container, not a message bus. Routing commands through it
asks it to do something it is not designed for.

### Option A Is the Right Answer — With One Constraint

Components call the Service directly for commands. This is clean, direct, and
consistent with how Flightpath GCS works — `useMAVLinkService()` gives
components access to `sendArmCommand`, `sendWaypoint`, and other command
methods.

The constraint that makes this safe is the **interface/implementation split**.
Components never import `DroneServiceImpl` — they access `DroneService` (the
interface) via `useDroneService()`. This means:

- The component is fully testable — inject a mock service via Context
- The component has no knowledge of how the command is executed
- The implementation can change without touching any component

```typescript
// ✅ Component calls the interface — clean and testable
function ArmButton({ targetId }: { targetId: string }) {
  const droneService = useDroneService()
  return (
    <button onClick={() => droneService.arm(targetId)}>
      Arm
    </button>
  )
}
```

### When Zustand and the Service Are Both Called

Many user interactions have two consequences: an immediate local UI change, and
a command to the outside world. The component coordinates both — neither routes
through the other:

```typescript
function DroneCard({ droneId }: { droneId: string }) {
  const droneService = useDroneService()
  const selectDrone  = useDroneStore(state => state.selectDrone)

  const handleClick = () => {
    selectDrone(droneId)                       // UI state → Zustand (immediate)
    droneService.fetchMissionHistory(droneId)  // command → Service (async)
  }

  return <div onClick={handleClick}>...</div>
}
```

`selectDrone` updates Zustand because selection is UI state — it belongs in the
store and should be reflected immediately regardless of whether the async
operation succeeds. `fetchMissionHistory` calls the Service because it initiates
an operation that touches the outside world. Both happen in the same handler, at
the same level, with no indirection between them.

### The Clean Rule

```
UI state changes   →  Zustand actions       (store owns it)
Commands to world  →  Service methods       (service owns it)
Both at once       →  Component coordinates (call each directly)
```

This is the CQRS analogy made concrete. The `MAVLinkService` interface in
Flightpath GCS makes this split explicit: Observables on the read side, command
methods on the write side. Components sit at the boundary — reading from
Zustand, writing through the Service — and the two worlds remain invisible to
each other.

### The Complete Data Flow

With command flow added, the full architecture is symmetric:

```
                    React Components
                   /                \
          read (hooks)           write (methods)
               |                       |
        useDroneStore()          useDroneService()
               |                       |
        Zustand Store            DroneService
               ▲                       |
               |               (RxJS pipeline,
        getState()._setX()       external I/O)
               |                       |
        DroneService  ◀────────────────┘
               ▲
               |
        External world
        (WebSocket / MAVLink / recorded stream)
```

Reads flow left (Service → Zustand → Components). Writes flow right (Components
→ Service → external world → back through the pipeline as new streaming state).
The Service is the only actor that touches both sides.

---

## Part 11: Telemetry Data

### Recorded Stream Format

```typescript
interface TelemetryFrame {
  droneId: string; // "alpha" | "bravo" | "charlie" etc.
  timestamp: number; // milliseconds from start of recording
  lat: number; // WGS84 latitude
  lng: number; // WGS84 longitude
  heading: number; // degrees clockwise from north
}
```

Frames for all drones are interleaved chronologically in a single array.
`DroneService` walks the array in order, dispatching frames whose timestamp has
elapsed on each 100ms tick.

### Suggested Drones

3-5 drones using NATO phonetic call signs: Alpha, Bravo, Charlie, Delta, Echo.
Each flies a distinct path in the Boston area (consistent with the Flightpath
GCS origin story). Paths can be hand-authored as simple waypoint sequences with
linear interpolation — real flight dynamics are not required.

---

## Part 12: Functional Requirements

### Map

- Full viewport Mapbox map via `MapProvider` from `lib/mapbox`.
- Style: `mapbox://styles/mapbox/dark-v11`.
- Initial view: fit bounds to encompass all drone starting positions.
- All drones rendered as a single Mapbox symbol layer via `useMapLayer`.
- Custom directional drone icon (SVG arrow), rotated to heading via data-driven
  `icon-rotate`.
- Selected drone visually distinct via feature-state.
- On each telemetry tick, `setData` updates the GeoJSON source — no layer
  removal or re-addition.

### Left Sidebar (~280px, fixed)

- Header with "Flightpath" title and playback status (Playing / Paused).
- Scrollable drone list — one card per drone showing: call sign, lat/lng (4
  decimal places), heading in degrees, connection status (Active / Lost).
- Lost = no update received in the last 2 seconds.
- Selected drone card highlighted.
- Clicking a card selects that drone.
- Playback controls at the bottom: Play/Pause toggle, Reset button.

### Drone Selection

- Clicking a map marker OR sidebar card selects the drone.
- On selection: feature-state highlight, sidebar card highlight, `useFlyTo` to
  drone position (zoom 14, duration 1500ms).
- Clicking map background deselects.
- `selectedDroneId: string | undefined` lives in `droneStore`.

### Status Bar

- Compact overlay anchored to the bottom of the map panel.
- Left side: active drone count, playback elapsed time, playback state (Playing
  / Paused).
- Right side: **FPS meter** — displays the current render frame rate as an
  integer (e.g. "60 fps"). Implemented as a self-contained `FpsMeter` component
  using `requestAnimationFrame` to count frames per second. Updates every
  second. Color-coded: green ≥ 50 fps, amber 30–49, red < 30. This gives
  immediate visibility into render performance at 10 Hz update rates and is
  directly analogous to the FPS table in the Flightpath GCS README.

---

## Part 13: State

### droneStore (vanilla)

| Field             | Type                                                | Description                              |
| ----------------- | --------------------------------------------------- | ---------------------------------------- |
| `drones`          | `Map<string, DroneState>`                           | Latest state per drone, keyed by droneId |
| `selectedDroneId` | `string \| undefined`                               | Currently selected drone                 |
| `selectDrone`     | `(id: string \| undefined) => void`                 | Called by components                     |
| `_updateDrone`    | `(id: string, update: Partial<DroneState>) => void` | Called only by DroneService              |

`Map<string, DroneState>` is preferred over `DroneState[]` because updates
arrive per drone and lookups must be O(1). The store patches one drone per tick
rather than replacing the entire collection.

```typescript
interface DroneState {
  droneId: string;
  callSign: string; // "Alpha", "Bravo", etc.
  lat: number;
  lng: number;
  heading: number;
  lastUpdatedAt: number; // Date.now() — used to derive connection status
}
```

### playbackStore (vanilla)

| Field       | Type                          | Description                                              |
| ----------- | ----------------------------- | -------------------------------------------------------- |
| `isPlaying` | `boolean`                     | Whether playback is active                               |
| `elapsedMs` | `number`                      | Milliseconds since playback start                        |
| `play`      | `() => void`                  | Start or resume (called only by DroneServiceImpl)        |
| `pause`     | `() => void`                  | Pause (called only by DroneServiceImpl)                  |
| `reset`     | `() => void`                  | Restart from beginning (called only by DroneServiceImpl) |
| `_tick`     | `(elapsedMs: number) => void` | Called only by DroneService                              |

Components must not call the store's `play`, `pause`, or `reset` for commands —
those are used by `DroneServiceImpl` to keep store state in sync. For playback
commands, components call `DroneService` (e.g. `useDroneService().play()`). Use
this store only to **read** `isPlaying` and `elapsedMs` for display.

Both stores are created with `createStore` from `zustand/vanilla`. React
components access them via thin `useDroneStore` and `usePlaybackStore` hooks
wrapping `useStore` from `zustand`.

---

## Part 14: File Structure

```
src/
  stores/
    droneStore.ts         ← vanilla store + useDroneStore hook
    playbackStore.ts      ← vanilla store + usePlaybackStore hook

  services/
    Service.ts            ← Service interface (onInit / onDestroy)
    ServiceProvider.tsx   ← generic lifecycle provider
    DroneService.ts       ← interface extending Service
    DroneServiceImpl.ts   ← RxJS pipeline + Zustand bridge
    DroneServiceContext.ts
    DroneServiceProvider.tsx

  gen/
    telemetry.json

  routes/
    flightpath/
      FlightpathPage.tsx      ← layout shell, wraps DroneServiceProvider
      FlightpathSidebar.tsx
      FlightpathMap.tsx
      DroneCard.tsx
```

`Service.ts` and `ServiceProvider.tsx` are shared infrastructure — identical to
the Flightpath GCS versions, reusable for any future service.

---

## Part 15: DroneServiceImpl

```typescript
// DroneServiceImpl.ts — zero React imports
import { interval, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { droneStore } from '../stores/droneStore';
import { playbackStore } from '../stores/playbackStore';
import telemetryData from '../../../gen/telemetry.json';

export class DroneServiceImpl implements DroneService {
  // Single destroy signal — terminates all subscriptions in onDestroy
  private readonly destroy$ = new Subject<void>();
  private frameIndex = 0;
  private readonly frames: TelemetryFrame[] = telemetryData;

  onInit() {
    this.startPlayback();
  }

  onDestroy() {
    // One call — all subscriptions with takeUntil(this.destroy$) stop simultaneously
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPlayback() {
    interval(100)
      .pipe(
        takeUntil(this.destroy$), // automatic cleanup — no manual unsubscribe needed
        // In a mission-critical app, never let an unhandled error tear down the stream silently.
        // Surface it, fail closed, and stop this pipeline explicitly.
        catchError((error) => {
          // TODO: replace console.error with structured logging / telemetry
          // and update a dedicated "stream health" indicator in state.
          // The key property is that we stop emitting frames on error instead of
          // continuing in an undefined state.
          // eslint-disable-next-line no-console
          console.error('[DroneService] playback stream failed', error);
          return EMPTY; // terminate this playback pipeline
        }),
      )
      .subscribe((tick) => {
        const elapsedMs = tick * 100;

        while (
          this.frameIndex < this.frames.length &&
          this.frames[this.frameIndex].timestamp <= elapsedMs
        ) {
          const frame = this.frames[this.frameIndex++];

          // THE BRIDGE: vanilla store accessed directly, no React involved
          droneStore.getState()._updateDrone(frame.droneId, {
            lat: frame.lat,
            lng: frame.lng,
            heading: frame.heading,
            lastUpdatedAt: Date.now(),
          });
        }

        playbackStore.getState()._tick(elapsedMs);
      });
  }

  play() {
    // Re-start the interval if not already running
    // takeUntil will have stopped it on pause; startPlayback creates a new subscription
    if (!playbackStore.getState().isPlaying) {
      this.startPlayback();
      playbackStore.getState().play();
    }
  }

  pause() {
    // Signal the destroy subject to stop the current interval
    this.destroy$.next();
    playbackStore.getState().pause();
  }

  reset() {
    this.pause();
    this.frameIndex = 0;
    playbackStore.getState().reset(); // reset elapsedMs and related playback state
    this.play(); // idempotent: starts a new interval only if not already playing
  }
}
```

Key points: `droneStore` and `playbackStore` are imported as vanilla objects,
not hooks. `takeUntil(this.destroy$)` replaces manual subscription tracking.
Zero React imports anywhere in the file.

---

## Part 16: Tech Concepts This Page Teaches

**The three categories of state** — UI state, server request/response state, and
real-time streaming state. Understanding which category a piece of state belongs
to determines the right tool.

**Vanilla-first Zustand stores** — `createStore` from `zustand/vanilla` creates
a store that is React-independent by design. The React hook is an explicit, thin
wrapper. Services import the vanilla store; components import the hook.

**The Service pattern** — pure TypeScript class with `onInit`/`onDestroy`,
interface/implementation split, delivery via React Context. Drawn directly from
the Flightpath GCS codebase.

**RxJS inside Services only** — `interval`, `Subject`, `throttleTime`,
`distinctUntilChanged`, `takeUntil` kept strictly inside the Service. Zero RxJS
exposure in components or hooks.

**The two directions of the bridge** — Stream → Zustand (incoming telemetry via
`.subscribe()` + `getState()`) and Zustand → RxJS (outgoing commands via Event
Sink pattern with `Subject` + `switchMap`). Both directions flow through the
Service; neither is visible to components.

**`takeUntil(destroy$)` for subscription lifecycle** — a single destroy Subject
terminates all subscriptions in one call. More idiomatic and scalable than
tracking individual Subscription references.

**Two layers of deduplication** — `distinctUntilChanged` in the RxJS pipeline
(guards store writes) and `shallow` in component selectors (guards re-renders).
Both are needed in high-frequency streaming contexts.

**Never store Observables in Zustand** — state must be plain and serialisable.
Observables belong in Services; Zustand holds only the values they produce.

**`Map<string, T>` for entity collections** — O(1) updates and lookups when many
entities update independently at high frequency.

**FPS meter via `requestAnimationFrame`** — a self-contained component that
counts frames per second using `requestAnimationFrame`, updates a display value
every second, and color-codes by performance tier. Decoupled from the telemetry
pipeline — it measures React render throughput independently of the data update
rate.

**`setData` at 10 Hz without React re-renders** — Mapbox layer updates are
decoupled from the React render cycle. `setData` on a GeoJSON source does not
trigger a component render.

**Playback as a proxy for live telemetry** — architecturally identical to a live
WebSocket stream from the Service's perspective. Switching from recorded to live
data requires only a new `DroneServiceImpl` — no component changes.

---

## Part 17: Out of Scope

- Actual MAVLink protocol (simulated stream sufficient to learn the pattern)
- Altitude, battery, or other telemetry beyond 2D position
- Command sending (arm, takeoff, waypoint) — receive-only page
- 3D visualization
- Persistence of any kind

---

## Part 18: Implementation Steps

| Step                              | What to Build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | What You Learn                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step 1** Telemetry Data         | Ask an AI to generate `telemetry.json`. Provide the prompt: _"Generate a JSON array of telemetry frames for 3 drones named alpha, bravo, and charlie flying distinct paths near Boston Logan Airport. Each frame has fields: droneId (string), timestamp (ms from 0), lat (WGS84), lng (WGS84), heading (degrees 0–360). Simulate 30 seconds at 10 Hz (300 frames per drone, 900 total), interleaved chronologically. Each drone should fly a realistic curved path — no sharp teleports. Return only the JSON array."_ Verify the output looks sensible by pasting the coordinates into geojson.io. | Prompting AI for structured data generation, validating coordinate data visually, understanding the telemetry frame schema before writing any code. |
| **Step 2** Vanilla Stores         | Create `droneStore.ts` using `createStore` from `zustand/vanilla`. Export both the vanilla `droneStore` and the `useDroneStore` hook wrapper. Same pattern for `playbackStore`. Add `devtools` middleware to both.                                                                                                                                                                                                                                                                                                                                                                                   | Vanilla-first store pattern, the explicit separation of vanilla store from React hook.                                                              |
| **Step 3** Service Infrastructure | Copy `Service.ts` and `ServiceProvider.tsx` from Flightpath GCS unchanged. Create `DroneService.ts` interface, `DroneServiceContext.ts`, `DroneServiceProvider.tsx` following the MAVLink pattern exactly.                                                                                                                                                                                                                                                                                                                                                                                           | Full Service pattern — interface, generic provider, Context delivery.                                                                               |
| **Step 4** DroneServiceImpl       | Implement with `interval(100).pipe(takeUntil(this.destroy$))`. Import vanilla `droneStore` directly. Walk frames, push via `getState()`. Implement `onDestroy` with `destroy$.next()` + `complete()`. Verify in DevTools that `_updateDrone` fires 10 times per second.                                                                                                                                                                                                                                                                                                                              | `takeUntil` lifecycle pattern, vanilla store bridge, zero React imports discipline, DevTools verification.                                          |
| **Step 5** Layout + Sidebar       | Wrap `FlightpathPage` in `DroneServiceProvider`. Two-panel layout. Sidebar subscribes to `drones` Map via `useDroneStore`, converts to array, renders `DroneCard` per drone with `shallow` selector. Wire playback **commands** to `useDroneService().play/pause/reset`; use `usePlaybackStore` to **read** `isPlaying` and `elapsedMs` for display.                                                                                                                                                                                                                                                 | Consuming `Map<string, DroneState>`, `shallow` selectors, selective re-renders.                                                                     |
| **Step 6** Map + Drone Layer      | Render all drones as a Mapbox symbol layer. On each store change, convert Map to GeoJSON FeatureCollection, call `setData`. Custom SVG drone icon with `icon-rotate` from heading property.                                                                                                                                                                                                                                                                                                                                                                                                          | `useMapLayer` + `setData` at 10 Hz, data-driven rotation, GeoJSON from Map.                                                                         |
| **Step 7** Drone Selection        | Click handler on symbol layer and sidebar cards. On select: feature-state highlight, sidebar highlight, `useFlyTo`. Deselect on background click.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Feature-state in real-time context, sidebar-map sync, `useFlyTo`.                                                                                   |
| **Step 8** Connection Status      | Derive `isActive` from `lastUpdatedAt` — Lost if no update in 2 seconds. Show colored indicator on each card.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Heartbeat detection from timestamp — the same pattern used in real GCS systems.                                                                     |
| **Step 9** Polish                 | Status bar overlay. Verify no memory leaks on unmount using DevTools. Test pause/resume/reset. Confirm `DroneServiceImpl` has zero React imports. Add `distinctUntilChanged` to the playback pipeline and verify in DevTools that redundant frames are filtered.                                                                                                                                                                                                                                                                                                                                     | Cleanup verification, `distinctUntilChanged` effect visible in DevTools, full pipeline discipline.                                                  |

---

## Definition of Done

1. All drones update position at 10 Hz — visible as smooth movement on the map.
2. Drone markers are directional — rotated to each drone's heading.
3. Sidebar drone list updates in real time on every tick.
4. Selecting a drone syncs map and sidebar, highlights the marker, and flies to
   it.
5. Deselecting clears highlight and sidebar selection.
6. Connection status shows Lost if a drone's updates stop for 2 seconds.
7. Playback controls (Play, Pause, Reset) work correctly.
8. Redux DevTools shows `_updateDrone` and `_tick` firing at 10 Hz.
9. No memory leaks on page unmount — `destroy$.next()` terminates all
   subscriptions.
10. `DroneServiceImpl` has zero React imports.
11. All component selectors use `shallow` for Map-valued state.
12. FPS meter displays in the status bar, updates every second, and color-codes
    correctly.
