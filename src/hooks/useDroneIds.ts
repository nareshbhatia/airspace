import { useShallow } from 'zustand/react/shallow';

import { useDroneStore } from './useDroneStore';
import { getDroneIds } from '../stores/DroneStore/selectors/droneFleetSelectors';

/**
 * Drone IDs for list rendering. Stable array reference when the key set is unchanged.
 */
export function useDroneIds(): string[] {
  return useDroneStore(useShallow(getDroneIds));
}
