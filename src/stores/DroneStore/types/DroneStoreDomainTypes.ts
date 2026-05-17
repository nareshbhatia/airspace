/**
 * Per-drone entity state.
 * This is the value stored in the drones Map, keyed by droneId.
 */
export interface DroneState {
  /** Unique identifier for this drone (e.g. "drone-000", "drone-042") */
  droneId: string;

  /**
   * Human-readable name (e.g. "Alpha-1", "Left-3", "Right-7").
   * Set by the telemetry generator based on formation position.
   */
  callSign: string;

  /** Current latitude in decimal degrees */
  lat: number;

  /** Current longitude in decimal degrees */
  lng: number;

  /** Current compass heading in degrees (0 = north, 90 = east) */
  heading: number;

  /** Timestamp (ms since epoch) of the last telemetry update for this drone */
  lastUpdatedAt: number;
}
