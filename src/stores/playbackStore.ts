import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

/** Playback store state. */
export interface PlaybackStoreState {
  isPlaying: boolean;
  elapsedMs: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  _tick: (elapsedMs: number) => void;
}

/** Vanilla store — importable by DroneService with no React dependency. */
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

/** React hook — thin view-layer wrapper, used only in components. */
export function usePlaybackStore<T>(
  selector: (state: PlaybackStoreState) => T,
): T {
  return useStore(playbackStore, selector);
}
