/**
 * All services should implement this interface.
 * It allows the ServiceProvider to implement the service lifecycle.
 */
export interface Service {
  /**
   * Function that the service should define to initialize any side effects
   * e.g. backend requests, registering hotkeys, etc.
   */
  onInit: () => void;

  /**
   * Function that the service should define to cleanup resources on unmount
   * e.g. to clean up subscriptions
   */
  onDestroy: () => void;
}
