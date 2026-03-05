/**
 * Playback Store
 * ==============
 *
 * Zustand vanilla store that tracks the simulation's playback state:
 * whether it's running and how long it has been running.
 *
 * This store exists primarily to drive the UI — play/pause buttons,
 * elapsed time display, etc. It does NOT control the simulation directly.
 * The control flow is:
 *
 *   User clicks "Play" → Component calls DroneService.play()
 *     → DroneServiceImpl starts the RxJS interval
 *     → DroneServiceImpl calls playbackStore.getState().play() to update UI state
 *
 * In other words, the service is the source of truth for what's actually
 * running. This store just reflects that state for the React layer.
 *
 * Convention: underscore-prefixed methods (_tick) are internal — called
 * by DroneServiceImpl, not by React components. Components read isPlaying
 * and elapsedMs via selectors, and issue commands through DroneService.
 */

import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaybackStoreState {
  /** Whether the simulation is currently running */
  isPlaying: boolean;

  /**
   * How long the simulation has been running in milliseconds.
   *
   * Updated by DroneServiceImpl on every tick:
   *   elapsedMs = initialElapsedMs + tickNumber × periodMs
   *
   * This accounts for pause/resume: when the user pauses and then
   * resumes, the service captures the current elapsedMs as the offset
   * for the new interval run, so elapsed time continues from where
   * it left off rather than resetting to zero.
   *
   * Used by the UI to display simulation duration (e.g. "2m 30s").
   */
  elapsedMs: number;

  /**
   * Set isPlaying to true.
   * Called by DroneServiceImpl when it starts/resumes the interval.
   * Components should NOT call this directly — use DroneService.play().
   */
  play: () => void;

  /**
   * Set isPlaying to false.
   * Called by DroneServiceImpl when it stops the interval.
   * Components should NOT call this directly — use DroneService.pause().
   */
  pause: () => void;

  /**
   * Reset to initial state: isPlaying = false, elapsedMs = 0.
   * Called by DroneServiceImpl.reset() before restarting from the beginning.
   * Components should NOT call this directly — use DroneService.reset().
   */
  reset: () => void;

  /**
   * Update the elapsed time. Called by DroneServiceImpl on every tick.
   * Internal — not for component use.
   *
   * @param elapsedMs - Total elapsed time since simulation start (ms)
   */
  _tick: (elapsedMs: number) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Vanilla Zustand store for playback state.
 *
 * Import this in services: `playbackStore.getState().play()`
 * Import the hook in components: `usePlaybackStore(state => state.isPlaying)`
 */
export const playbackStore = createStore<PlaybackStoreState>()(
  devtools(
    (set) => ({
      isPlaying: false,
      elapsedMs: 0,
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      reset: () => set({ isPlaying: false, elapsedMs: 0 }),
      _tick: (elapsedMs) => set({ elapsedMs }),
    }),
    { name: 'PlaybackStore' },
  ),
);

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * React hook for reading playback store state in components.
 *
 * Usage:
 *   const isPlaying = usePlaybackStore(state => state.isPlaying);
 *   const elapsedMs = usePlaybackStore(state => state.elapsedMs);
 *
 * @param selector - Function that extracts the slice of state you need
 */
export function usePlaybackStore<T>(
  selector: (state: PlaybackStoreState) => T,
): T {
  return useStore(playbackStore, selector);
}
