import { useShallow } from 'zustand/react/shallow';

import { useDroneStore } from './useDroneStore';

import type { DroneStore } from '../stores/DroneStore/types/DroneStore';

type DroneSelection = Pick<DroneStore, 'selectedDroneId' | 'selectDrone'>;

/**
 * Selection id and select action for map/sidebar interactions.
 */
export function useDroneSelection(): DroneSelection {
  return useDroneStore(
    useShallow((state) => ({
      selectedDroneId: state.selectedDroneId,
      selectDrone: state.selectDrone,
    })),
  );
}
