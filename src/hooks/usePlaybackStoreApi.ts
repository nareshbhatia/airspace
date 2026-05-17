import { useContext } from 'react';

import { PlaybackStoreContext } from '../providers/PlaybackStoreProvider/PlaybackStoreContext';

import type { PlaybackStoreApi } from '../stores/PlaybackStore/types/PlaybackStoreApi';

/**
 * Returns the playback store API for imperative reads and subscriptions in effects.
 * Returns null outside PlaybackStoreProvider so effects can no-op.
 *
 * Prefer usePlaybackStore when render only needs the latest selected state.
 */
export function usePlaybackStoreApi(): PlaybackStoreApi | null {
  return useContext(PlaybackStoreContext);
}
