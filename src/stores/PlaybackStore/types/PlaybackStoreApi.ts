import type { createPlaybackStore } from '../createPlaybackStore';

/**
 * Store instance from `createPlaybackStore()` (bound store with subscribeWithSelector).
 * Use for context, services, and `useStore(api, selector)`.
 */
export type PlaybackStoreApi = ReturnType<typeof createPlaybackStore>;
