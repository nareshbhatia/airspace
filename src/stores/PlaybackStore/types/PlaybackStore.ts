import type {
  PlaybackStoreControlSlice,
  PlaybackStoreElapsedSlice,
} from './PlaybackStoreSliceContracts';

export type { PlaybackStoreApi } from './PlaybackStoreApi';
export type {
  PlaybackStoreControlSlice,
  PlaybackStoreElapsedSlice,
} from './PlaybackStoreSliceContracts';

/** Composed playback store: elapsed time + transport control. */
export type PlaybackStore = PlaybackStoreElapsedSlice &
  PlaybackStoreControlSlice;
