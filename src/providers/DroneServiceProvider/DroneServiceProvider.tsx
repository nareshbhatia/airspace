import { useMemo } from 'react';

import { DroneServiceContext } from './DroneServiceContext';
import { airportById } from '../../gen/airports';
import {
  DroneServiceImpl,
  type SimulationConfig,
} from '../../services/DroneServiceImpl';
import { ServiceProvider } from '../ServiceProvider/ServiceProvider';

import type { ReactNode } from 'react';

const initialCoordinates = airportById.get('BOS')?.coordinates ?? {
  lat: 0,
  lng: 0,
};

const { lat: initialLat, lng: initialLng } = initialCoordinates;

const config: SimulationConfig = {
  droneCount: 225, // 15² = 15 rows in the wedge
  speed: 100, // 100 m/s
  heading: 270, // west
  initialLat,
  initialLng,
  lateralSpacing: 250, // 250m between drones in a row
  depthOffset: 250, // 250m between rows
  tickRateHz: 10, // 10 telemetry updates per second
};

interface DroneServiceProviderProps {
  children?: ReactNode;
}

/**
 * Provides DroneService to the subtree via context.
 * Instantiates DroneServiceImpl once and manages its lifecycle (onInit on mount,
 * onDestroy on unmount) through the generic ServiceProvider.
 */
export function DroneServiceProvider({ children }: DroneServiceProviderProps) {
  const droneService = useMemo(() => new DroneServiceImpl(config), []);

  return (
    <ServiceProvider
      serviceContext={DroneServiceContext}
      serviceInstance={droneService}
    >
      {children}
    </ServiceProvider>
  );
}
