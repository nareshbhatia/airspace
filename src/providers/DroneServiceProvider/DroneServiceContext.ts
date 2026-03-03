import { createContext } from 'react';

import type { DroneService } from '../../services/DroneService';

export const DroneServiceContext = createContext<DroneService | null>(null);
