import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createDronesSlice } from './slices/dronesSlice';
import { createSelectionSlice } from './slices/selectionSlice';

import type { DroneStore } from './types/DroneStore';

/**
 * Creates the production DroneStore (fleet + selection).
 * Used by DroneStoreProvider; use a vanilla factory without middleware in isolated tests.
 */
export const createDroneStore = () => {
  return create<DroneStore>()(
    devtools(
      subscribeWithSelector(
        immer((set, get, store) => ({
          ...createDronesSlice(set, get, store),
          ...createSelectionSlice(set, get, store),
        })),
      ),
      { name: 'DroneStore', autoPause: true, maxAge: 1 },
    ),
  );
};
