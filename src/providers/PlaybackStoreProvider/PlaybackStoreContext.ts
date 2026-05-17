import { createContext } from 'react';

import type { PlaybackStoreApi } from '../../stores/PlaybackStore/types/PlaybackStoreApi';

export const PlaybackStoreContext = createContext<PlaybackStoreApi | null>(
  null,
);
