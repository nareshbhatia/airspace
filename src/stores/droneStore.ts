/**
 * Drone Store
 * ===========
 *
 * Zustand vanilla store that holds the state of all drones in the simulation.
 * This is the single source of truth for drone positions — React components
 * read from here via selectors, and the DroneServiceImpl writes to it on
 * every telemetry tick.
 *
 * Key design decisions:
 *
 *   1. Vanilla store (createStore, not create):
 *      The store is created with `createStore` from 'zustand/vanilla' so that
 *      non-React code (DroneServiceImpl) can import and use it directly via
 *      `droneStore.getState()._updateDrones(...)`. The React hook
 *      `useDroneStore()` is a thin wrapper for component use.
 *
 *   2. Map<string, DroneState> for O(1) lookups:
 *      Drones are stored in a Map keyed by droneId. This gives O(1) lookup
 *      for individual drone selection and avoids linear scans.
 *
 *   3. subscribeWithSelector middleware:
 *      Enables fine-grained React subscriptions. A component displaying a
 *      single drone can subscribe to just that drone's state and won't
 *      re-render when other drones update. Critical for performance when
 *      hundreds of drones are updating at 10-20 Hz.
 *
 *   4. Batch update (_updateDrones) vs single update (_updateDrone):
 *      The batch method creates one new Map and fires one Zustand notification,
 *      regardless of drone count. This is essential for the stress test:
 *
 *        _updateDrone:  N drones → N new Maps → N Zustand set() calls
 *        _updateDrones: N drones → 1 new Map  → 1 Zustand set() call
 *
 *      At 500 drones × 20 Hz, that's the difference between 10,000 and 20
 *      store updates per second.
 *
 *   5. Convention: underscore-prefixed methods (_updateDrone, _updateDrones, _clearDrones)
 *      are internal — called by DroneServiceImpl, not by React components.
 *      Components use selectDrone() for user interactions and read state
 *      via selectors.
 */

import { useStore } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Per-drone entity state.
 * This is the value stored in the drones Map, keyed by droneId.
 */
export interface DroneState {
  /** Unique identifier for this drone (e.g. "drone-000", "drone-042") */
  droneId: string;

  /**
   * Human-readable name (e.g. "Alpha-1", "Left-3", "Right-7").
   * Set by the telemetry generator based on formation position.
   */
  callSign: string;

  /** Current latitude in decimal degrees */
  lat: number;

  /** Current longitude in decimal degrees */
  lng: number;

  /** Current compass heading in degrees (0 = north, 90 = east) */
  heading: number;

  /** Timestamp (ms since epoch) of the last telemetry update for this drone */
  lastUpdatedAt: number;
}

/**
 * Full drone store state shape.
 *
 * Organized into three categories:
 *   - Data:     drones, selectedDroneId
 *   - Public:   selectDrone (called by components for user interactions)
 *   - Internal: _updateDrone, _updateDrones, _clearDrones (called by DroneServiceImpl)
 */
export interface DroneStoreState {
  /** Map of all drones, keyed by droneId. Empty on initialization. */
  drones: Map<string, DroneState>;

  /** Currently selected drone ID, or undefined if no drone is selected */
  selectedDroneId: string | undefined;

  /**
   * Select a drone by ID (or deselect with undefined).
   * Called by React components in response to user interaction
   * (e.g. clicking a drone on the map or in a list).
   */
  selectDrone: (id: string | undefined) => void;

  /**
   * Upsert a single drone.
   *
   * Creates the drone if it doesn't exist, otherwise merges the update
   * into the existing state. Creates a new Map on every call (so Zustand
   * detects the change via reference equality).
   *
   * Retained for cases where a single drone needs updating outside of the
   * main telemetry loop. For bulk updates from the generator, use
   * _updateDrones() instead.
   */
  _updateDrone: (id: string, update: Partial<DroneState>) => void;

  /**
   * Batch-update all drones in a single store transaction.
   *
   * This is the primary update path during simulation. The DroneServiceImpl
   * calls this once per tick with the full DroneState[] from the telemetry
   * generator.
   *
   * Performance characteristics:
   *   - Creates one new Map (cloned from current)
   *   - Sets all drone entries in a for...of loop (no intermediate Maps)
   *   - Calls Zustand set() exactly once
   *   - Triggers one notification to all subscribers
   *
   * @param states - Complete DroneState objects (not partial updates).
   *   The generator produces full DroneState on every tick, so there's
   *   no need for merge logic here.
   */
  _updateDrones: (states: DroneState[]) => void;

  /**
   * Clear all drones from the store.
   * Called by DroneServiceImpl.reset() before restarting the simulation
   * so stale drones from the previous run don't linger on the map.
   */
  _clearDrones: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState = {
  drones: new Map<string, DroneState>(),
  selectedDroneId: undefined,
};

/**
 * Vanilla Zustand store — the single source of truth for drone state.
 *
 * Import this in services: `droneStore.getState()._updateDrones(states)`
 * Import the hook in components: `useDroneStore(state => state.drones)`
 */
export const droneStore = createStore<DroneStoreState>()(
  devtools(
    subscribeWithSelector((set) => ({
      ...initialState,

      selectDrone: (id) => set({ selectedDroneId: id }),

      _updateDrone: (id, update) =>
        set((state) => {
          const existing = state.drones.get(id);
          // Derive a callSign for new drones if one isn't provided
          const callSign =
            existing?.callSign ??
            id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
          return {
            // New Map reference so Zustand detects the change
            drones: new Map(state.drones).set(id, {
              droneId: id,
              callSign,
              lat: 0,
              lng: 0,
              heading: 0,
              lastUpdatedAt: 0,
              ...existing,
              ...update,
            }),
          };
        }),

      _updateDrones: (states) =>
        set((state) => {
          // Clone the current Map once, then set all entries.
          // This produces exactly one new Map reference and one set() call,
          // regardless of how many drones are in the states array.
          const next = new Map(state.drones);
          for (const drone of states) {
            next.set(drone.droneId, drone);
          }
          return { drones: next };
        }),

      _clearDrones: () => set({ drones: new Map() }),
    })),
    { name: 'DroneStore' },
  ),
);

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * React hook for reading drone store state in components.
 *
 * This is a thin wrapper around Zustand's useStore. Always use a selector
 * to avoid unnecessary re-renders:
 *
 *   // Good — re-renders only when the drones Map changes
 *   const drones = useDroneStore(state => state.drones);
 *
 *   // Good — re-renders only when the selected drone ID changes
 *   const selectedId = useDroneStore(state => state.selectedDroneId);
 *
 *   // Bad — re-renders on every store change (no selector benefit)
 *   const store = useDroneStore(state => state);
 *
 * @param selector - Function that extracts the slice of state you need
 * @returns The selected slice, with referential stability from subscribeWithSelector
 */
export function useDroneStore<T>(selector: (state: DroneStoreState) => T): T {
  return useStore(droneStore, selector);
}
