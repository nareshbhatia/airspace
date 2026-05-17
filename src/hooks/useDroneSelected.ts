import { useDroneStore } from './useDroneStore';
import { getSelectedDrone } from '../stores/DroneStore/selectors/droneSelectionSelectors';

import type { DroneState } from '../stores/DroneStore/types/DroneStoreDomainTypes';

/**
 * The currently selected drone, or undefined when none is selected.
 */
export function useDroneSelected(): DroneState | undefined {
  return useDroneStore(getSelectedDrone);
}
