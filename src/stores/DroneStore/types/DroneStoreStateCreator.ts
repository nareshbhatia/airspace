import type { DroneStore } from './DroneStore';
import type { StateCreator } from 'zustand';

/** StateCreator for DroneStore slices (immer + subscribeWithSelector stack). */
export type DroneStoreStateCreator<T = DroneStore> = StateCreator<
  DroneStore,
  [['zustand/immer', never], ['zustand/subscribeWithSelector', never]],
  [],
  T
>;
