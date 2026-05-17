import type { PlaybackStoreControlSlice } from '../types/PlaybackStoreSliceContracts';
import type { PlaybackStoreStateCreator } from '../types/PlaybackStoreStateCreator';

export const createPlaybackControlSlice: PlaybackStoreStateCreator<
  PlaybackStoreControlSlice
> = (set) => ({
  isPlaying: false,

  play: () =>
    set((state) => {
      state.isPlaying = true;
    }),

  pause: () =>
    set((state) => {
      state.isPlaying = false;
    }),

  reset: () =>
    set((state) => {
      state.isPlaying = false;
      state.elapsedMs = 0;
    }),
});
