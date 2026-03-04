import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

/** Playback store state. */
export interface PlaybackStoreState {
  isPlaying: boolean;
  elapsedMs: number;
  isAtEnd: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
  _tick: (elapsedMs: number) => void;
  _setAtEnd: (value: boolean) => void;
}

/**
 * Vanilla store — importable by DroneService with no React dependency.
 * The store's `play`, `pause`, and `reset` are for use by DroneServiceImpl
 * when executing commands; components should call DroneService.play/pause/reset,
 * not the store.
 */
export const playbackStore = createStore<PlaybackStoreState>()(
  devtools(
    (set) => ({
      isPlaying: false,
      elapsedMs: 0,
      isAtEnd: false,
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      reset: () => set({ isPlaying: false, elapsedMs: 0, isAtEnd: false }),
      _tick: (elapsedMs) => set({ elapsedMs }),
      _setAtEnd: (value) => set({ isAtEnd: value }),
    }),
    { name: 'PlaybackStore' },
  ),
);

/** React hook — thin view-layer wrapper, used only in components. */
export function usePlaybackStore<T>(
  selector: (state: PlaybackStoreState) => T,
): T {
  return useStore(playbackStore, selector);
}
