import type {
  PlaybackStoreControlSlice,
  PlaybackStoreElapsedSlice,
} from './PlaybackStoreSliceContracts';

/** Composed playback store: elapsed time + transport control. */
export type PlaybackStore = PlaybackStoreElapsedSlice &
  PlaybackStoreControlSlice;
