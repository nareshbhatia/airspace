import { useContext } from 'react';

import { useStore } from 'zustand';

import { PlaybackStoreContext } from '../providers/PlaybackStoreProvider/PlaybackStoreContext';

import type { PlaybackStore } from '../stores/PlaybackStore/types/PlaybackStore';

/**
 * React hook for reading playback store state in components.
 *
 * Always use a selector to avoid unnecessary re-renders:
 *
 *   const isPlaying = usePlaybackStore((state) => state.isPlaying);
 *   const elapsedMs = usePlaybackStore((state) => state.elapsedMs);
 */
export function usePlaybackStore<T>(selector: (state: PlaybackStore) => T): T {
  const api = useContext(PlaybackStoreContext);

  if (!api) {
    throw new Error(
      'usePlaybackStore must be used within PlaybackStoreProvider',
    );
  }

  return useStore(api, selector);
}
