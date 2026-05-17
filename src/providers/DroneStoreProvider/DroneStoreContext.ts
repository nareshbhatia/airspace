import { createContext } from 'react';

import type { DroneStoreApi } from '../../stores/DroneStore/types/DroneStoreApi';

export const DroneStoreContext = createContext<DroneStoreApi | null>(null);
