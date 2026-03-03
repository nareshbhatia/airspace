import { useMemo } from 'react';

import { DroneServiceContext } from './DroneServiceContext';
import { DroneServiceImpl } from '../../services/DroneServiceImpl';
import { ServiceProvider } from '../ServiceProvider/ServiceProvider';

import type { ReactNode } from 'react';

interface DroneServiceProviderProps {
  children?: ReactNode;
}

/**
 * Provides DroneService to the subtree via context.
 * Instantiates DroneServiceImpl once and manages its lifecycle (onInit on mount,
 * onDestroy on unmount) through the generic ServiceProvider.
 */
export function DroneServiceProvider({ children }: DroneServiceProviderProps) {
  const droneService = useMemo(() => new DroneServiceImpl(), []);

  return (
    <ServiceProvider
      serviceContext={DroneServiceContext}
      serviceInstance={droneService}
    >
      {children}
    </ServiceProvider>
  );
}
