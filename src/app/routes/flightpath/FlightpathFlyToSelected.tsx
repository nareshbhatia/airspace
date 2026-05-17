import { useMemo } from 'react';

import { useDroneSelection } from '../../../hooks/useDroneSelection';
import { useDroneStoreApi } from '../../../hooks/useDroneStoreApi';
import { useFlyTo } from '../../../lib/mapbox';
import { getSelectedDrone } from '../../../stores/DroneStore/selectors/droneSelectionSelectors';

/**
 * Flies the map to the currently selected drone when selection changes.
 * Zoom 14, duration 1500 ms. Does nothing when no drone is selected.
 */
export function FlightpathFlyToSelected() {
  const storeApi = useDroneStoreApi();
  const { selectedDroneId } = useDroneSelection();

  const centerOnSelection = useMemo(() => {
    if (!storeApi || selectedDroneId === undefined) {
      return undefined;
    }
    const drone = getSelectedDrone(storeApi.getState());
    if (!drone) {
      return undefined;
    }
    return { lat: drone.lat, lng: drone.lng };
  }, [storeApi, selectedDroneId]);

  useFlyTo(centerOnSelection, { zoom: 14, duration: 1500 });
  return null;
}
