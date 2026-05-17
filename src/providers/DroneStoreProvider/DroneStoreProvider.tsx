import { useState } from 'react';

import { DroneStoreContext } from './DroneStoreContext';
import { createDroneStore } from '../../stores/DroneStore/createDroneStore';

import type { ReactNode } from 'react';

interface DroneStoreProviderProps {
  children?: ReactNode;
}

/**
 * Provides a per-mount DroneStore instance via context for React hooks and services.
 */
export function DroneStoreProvider({ children }: DroneStoreProviderProps) {
  const [store] = useState(() => createDroneStore());

  return (
    <DroneStoreContext.Provider value={store}>
      {children}
    </DroneStoreContext.Provider>
  );
}
