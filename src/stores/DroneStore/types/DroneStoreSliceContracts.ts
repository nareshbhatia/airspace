import type { DroneState } from './DroneStoreDomainTypes';

/** Fleet data and internal telemetry writers (DroneServiceImpl). */
export interface DroneStoreDronesSlice {
  /** Map of all drones, keyed by droneId. Empty on initialization. */
  drones: Map<string, DroneState>;

  /**
   * Batch-update all drones in a single store transaction.
   *
   * Primary update path during simulation — replaces the fleet Map each tick
   * (Immer produces an immutable snapshot for subscribers).
   */
  _updateDrones: (states: DroneState[]) => void;

  /** Clear all drones (e.g. on simulation reset). */
  _clearDrones: () => void;
}

/** UI selection state (React components). */
export interface DroneStoreSelectionSlice {
  /** Currently selected drone ID, or undefined if no drone is selected */
  selectedDroneId: string | undefined;

  /**
   * Select a drone by ID (or deselect with undefined).
   * Called by React components in response to user interaction.
   */
  selectDrone: (id: string | undefined) => void;
}
