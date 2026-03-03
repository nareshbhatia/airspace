import { useContext } from 'react';

import { DroneServiceContext } from './DroneServiceContext';

import type { DroneService } from '../../services/DroneService';

/**
 * Returns the DroneService instance from the nearest DroneServiceProvider.
 * Throws if used outside a DroneServiceProvider.
 */
export function useDroneService(): DroneService {
  const droneService = useContext(DroneServiceContext);

  if (!droneService) {
    throw new Error('DroneService is not provided');
  }

  return droneService;
}
