import type { DroneStore } from '../types/DroneStore';

export function createDroneByIdSelector(droneId: string) {
  return (store: DroneStore) => store.drones.get(droneId);
}

export function getDroneIds(store: DroneStore): string[] {
  return Array.from(store.drones.keys());
}
