/**
 * Playback Store
 * ==============
 *
 * Zustand store that tracks the simulation's playback state: whether it's
 * running and how long it has been running.
 *
 * This store exists primarily to drive the UI — play/pause buttons, elapsed
 * time display, etc. It does NOT control the simulation directly. The control
 * flow is:
 *
 *   User clicks "Play" → Component calls DroneService.play()
 *     → DroneServiceImpl starts the RxJS interval
 *     → DroneServiceImpl calls playbackStore.getState().play() to update UI state
 *
 * In other words, the service is the source of truth for what's actually
 * running. This store just reflects that state for the React layer.
 *
 * Convention: underscore-prefixed methods (_tick) are internal — called by
 * DroneServiceImpl, not by React components. Components read isPlaying and
 * elapsedMs via selectors, and issue commands through DroneService.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createElapsedTimeSlice } from './slices/elapsedTimeSlice';
import { createPlaybackControlSlice } from './slices/playbackControlSlice';

import type { PlaybackStore } from './types/PlaybackStore';

/**
 * Creates the production PlaybackStore (elapsed time + transport control).
 * Used by PlaybackStoreProvider; use a vanilla factory without middleware in
 * isolated tests.
 */
export const createPlaybackStore = () => {
  return create<PlaybackStore>()(
    devtools(
      subscribeWithSelector(
        immer((set, get, store) => ({
          ...createElapsedTimeSlice(set, get, store),
          ...createPlaybackControlSlice(set, get, store),
        })),
      ),
      { name: 'PlaybackStore', autoPause: true, maxAge: 1 },
    ),
  );
};
