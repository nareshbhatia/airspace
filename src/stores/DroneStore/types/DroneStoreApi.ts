import type { createDroneStore } from '../createDroneStore';

/**
 * Store instance from `createDroneStore()` (bound store with subscribeWithSelector).
 * Use for context, services, and `useStore(api, selector)`.
 */
export type DroneStoreApi = ReturnType<typeof createDroneStore>;
