import { useContext } from 'react';

import { useStore } from 'zustand';

import { DroneStoreContext } from '../providers/DroneStoreProvider/DroneStoreContext';

import type { DroneStore } from '../stores/DroneStore/types/DroneStore';

/**
 * React hook for reading drone store state in components.
 *
 * Always use a selector to avoid unnecessary re-renders:
 *
 *   const drones = useDroneStore((state) => state.drones);
 *   const selectedId = useDroneStore((state) => state.selectedDroneId);
 */
export function useDroneStore<T>(selector: (state: DroneStore) => T): T {
  const api = useContext(DroneStoreContext);

  if (!api) {
    throw new Error('useDroneStore must be used within DroneStoreProvider');
  }

  return useStore(api, selector);
}
