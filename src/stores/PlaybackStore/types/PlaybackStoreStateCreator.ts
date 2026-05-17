import type { PlaybackStore } from './PlaybackStore';
import type { StateCreator } from 'zustand';

/** StateCreator for PlaybackStore slices (immer + subscribeWithSelector stack). */
export type PlaybackStoreStateCreator<T = PlaybackStore> = StateCreator<
  PlaybackStore,
  [['zustand/immer', never], ['zustand/subscribeWithSelector', never]],
  [],
  T
>;
