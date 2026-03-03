import { useEffect, useRef } from 'react';

import type { Service } from '../../services/Service';
import type { ReactNode, Context } from 'react';

const useServiceLifecycle = (service: Service) => {
  // Using a ref to ensure we only call onDestroy on unmount, not on any component updates
  const serviceRef = useRef(service);

  useEffect(() => {
    const serviceInstance = serviceRef.current;

    // On mount, call the onInit() function of the service
    serviceInstance.onInit();

    // On unmount, call the onDestroy function of the service
    return () => {
      serviceInstance.onDestroy();
    };
  }, []); // Empty dependency array - only run on mount/unmount
};

interface ServiceProviderProps<TService extends Service> {
  /** The React Context object that is defined for the service */
  serviceContext: Context<TService | undefined>;

  /** The service instance that should be set as the provider value */
  serviceInstance: TService;

  children?: ReactNode;
}

/**
 * Reusable provider for a single service.
 * It will automatically handle initializing the service on mount and destroying it on unmount.
 */
export function ServiceProvider<TService extends Service>({
  serviceContext,
  serviceInstance,
  children,
}: ServiceProviderProps<TService>) {
  useServiceLifecycle(serviceInstance);

  return (
    <serviceContext.Provider value={serviceInstance}>
      {children}
    </serviceContext.Provider>
  );
}
