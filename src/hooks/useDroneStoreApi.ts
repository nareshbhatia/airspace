import { useContext } from 'react';

import { DroneStoreContext } from '../providers/DroneStoreProvider/DroneStoreContext';

import type { DroneStoreApi } from '../stores/DroneStore/types/DroneStoreApi';

/**
 * Returns the drone store API for imperative reads and subscriptions in effects.
 * Returns null outside DroneStoreProvider so effects can no-op.
 *
 * Prefer useDroneStore when render only needs the latest selected state.
 */
export function useDroneStoreApi(): DroneStoreApi | null {
  return useContext(DroneStoreContext);
}
