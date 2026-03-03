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
    subscribeWithSelector((set) => ({
      ...initialState,
      selectDrone: (id) => set({ selectedDroneId: id }),
      _updateDrone: (id, update) =>
        set((state) => {
          const existing = state.drones.get(id);
          if (!existing) {
            console.error(`Cannot update non-existent drone: ${id}`);
            return state;
          }
          return {
            drones: new Map(state.drones).set(id, {
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
