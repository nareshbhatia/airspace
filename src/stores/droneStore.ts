import { useStore } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

/** Per-drone entity state (value in the drones Map). */
export interface DroneState {
  droneId: string;
  callSign: string;
  lat: number;
  lng: number;
  heading: number;
  lastUpdatedAt: number;
}

/** Full drone store state (drones map + selection + actions). */
export interface DroneStoreState {
  drones: Map<string, DroneState>;
  selectedDroneId: string | undefined;
  selectDrone: (id: string | undefined) => void;
  _updateDrone: (id: string, update: Partial<DroneState>) => void;
}

const initialState = {
  drones: new Map<string, DroneState>(),
  selectedDroneId: undefined,
};

/** Vanilla store — importable by Services with no React dependency. */
export const droneStore = createStore<DroneStoreState>()(
  devtools(
    // subscribeWithSelector: enables selectors that only re-run when selected slice changes (e.g. one drone).
    subscribeWithSelector((set) => ({
      ...initialState,
      selectDrone: (id) => set({ selectedDroneId: id }),
      // Upsert: create drone if missing, otherwise merge update into existing. Used by DroneServiceImpl at 10 Hz.
      _updateDrone: (id, update) =>
        set((state) => {
          const existing = state.drones.get(id);
          // Keep existing callSign on update; for new drones derive from id (e.g. "alpha" → "Alpha").
          const callSign =
            existing?.callSign ??
            id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
          return {
            // New Map so Zustand detects change; set(id, value) replaces or adds the drone.
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
    })),
    { name: 'DroneStore' },
  ),
);

/** React hook — thin view-layer wrapper, used only in components. */
export function useDroneStore<T>(selector: (state: DroneStoreState) => T): T {
  return useStore(droneStore, selector);
}
