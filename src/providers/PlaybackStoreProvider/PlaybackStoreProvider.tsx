import { useState } from 'react';

import { PlaybackStoreContext } from './PlaybackStoreContext';
import { createPlaybackStore } from '../../stores/PlaybackStore/createPlaybackStore';

import type { ReactNode } from 'react';

interface PlaybackStoreProviderProps {
  children?: ReactNode;
}

/**
 * Provides a per-mount PlaybackStore instance via context for React hooks and services.
 */
export function PlaybackStoreProvider({
  children,
}: PlaybackStoreProviderProps) {
  const [store] = useState(() => createPlaybackStore());

  return (
    <PlaybackStoreContext.Provider value={store}>
      {children}
    </PlaybackStoreContext.Provider>
  );
}
