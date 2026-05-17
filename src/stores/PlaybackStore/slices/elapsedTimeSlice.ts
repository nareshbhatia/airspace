import type { PlaybackStoreElapsedSlice } from '../types/PlaybackStoreSliceContracts';
import type { PlaybackStoreStateCreator } from '../types/PlaybackStoreStateCreator';

export const createElapsedTimeSlice: PlaybackStoreStateCreator<
  PlaybackStoreElapsedSlice
> = (set) => ({
  elapsedMs: 0,

  _tick: (elapsedMs) =>
    set((state) => {
      state.elapsedMs = elapsedMs;
    }),
});
