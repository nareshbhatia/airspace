import type {
  DroneStoreDronesSlice,
  DroneStoreSelectionSlice,
} from './DroneStoreSliceContracts';

export type { DroneStoreApi } from './DroneStoreApi';
export type { DroneState } from './DroneStoreDomainTypes';
export type {
  DroneStoreDronesSlice,
  DroneStoreSelectionSlice,
} from './DroneStoreSliceContracts';

/** Composed drone store: fleet + selection. */
export type DroneStore = DroneStoreDronesSlice & DroneStoreSelectionSlice;
