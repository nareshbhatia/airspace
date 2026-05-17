import type { DroneStore } from '../types/DroneStore';
import type { DroneState } from '../types/DroneStoreDomainTypes';

export function getSelectedDrone(store: DroneStore): DroneState | undefined {
  const { selectedDroneId, drones } = store;
  return selectedDroneId !== undefined
    ? drones.get(selectedDroneId)
    : undefined;
}
