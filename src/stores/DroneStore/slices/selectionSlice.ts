import type { DroneStoreSelectionSlice } from '../types/DroneStoreSliceContracts';
import type { DroneStoreStateCreator } from '../types/DroneStoreStateCreator';

export const createSelectionSlice: DroneStoreStateCreator<
  DroneStoreSelectionSlice
> = (set) => ({
  selectedDroneId: undefined,

  selectDrone: (id) => set({ selectedDroneId: id }),
});
