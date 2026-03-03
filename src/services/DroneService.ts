import type { Service } from './Service';

/**
 * Drone service interface for playback and telemetry.
 * Components call the service for commands (play, pause, reset); they read
 * state from Zustand only.
 */
export interface DroneService extends Service {
  play: () => void;
  pause: () => void;
  reset: () => void;
}
