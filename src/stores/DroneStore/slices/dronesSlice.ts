import type { DroneState } from '../types/DroneStoreDomainTypes';
import type { DroneStoreDronesSlice } from '../types/DroneStoreSliceContracts';
import type { DroneStoreStateCreator } from '../types/DroneStoreStateCreator';

export const createDronesSlice: DroneStoreStateCreator<
  DroneStoreDronesSlice
> = (set) => ({
  drones: new Map<string, DroneState>(),

  _updateDrones: (states) =>
    set((state) => {
      state.drones = new Map(states.map((d) => [d.droneId, d]));
    }),

  _clearDrones: () =>
    set((state) => {
      state.drones = new Map();
    }),
});
