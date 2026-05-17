/** Elapsed simulation time (updated each tick by DroneServiceImpl). */
export interface PlaybackStoreElapsedSlice {
  /**
   * How long the simulation has been running in milliseconds.
   *
   * Updated by DroneServiceImpl on every tick:
   *   elapsedMs = initialElapsedMs + tickNumber × periodMs
   */
  elapsedMs: number;

  /**
   * Update the elapsed time. Called by DroneServiceImpl on every tick.
   * Internal — not for component use.
   */
  _tick: (elapsedMs: number) => void;
}

/** Playback transport state (play/pause/reset — DroneServiceImpl only). */
export interface PlaybackStoreControlSlice {
  /** Whether the simulation is currently running */
  isPlaying: boolean;

  /**
   * Set isPlaying to true.
   * Called by DroneServiceImpl when it starts/resumes the interval.
   */
  play: () => void;

  /**
   * Set isPlaying to false.
   * Called by DroneServiceImpl when it stops the interval.
   */
  pause: () => void;

  /**
   * Reset to initial state: isPlaying = false, elapsedMs = 0.
   * Called by DroneServiceImpl.reset() before restarting from the beginning.
   */
  reset: () => void;
}
