import { useEffect, useState } from 'react';

import { useFlyTo } from '../../../lib/mapbox';
import { useDroneStore } from '../../../stores/droneStore';

/**
 * Flies the map to the currently selected drone when selection changes.
 * Zoom 14, duration 1500 ms. Does nothing when no drone is selected.
 */
export function FlightpathFlyToSelected() {
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const drones = useDroneStore((state) => state.drones);
  const selectedDrone = selectedDroneId
    ? drones.get(selectedDroneId)
    : undefined;
  // Only fly when selection changes, not when position updates (avoids 10 Hz re-renders)
  const [centerOnSelection, setCenterOnSelection] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  useEffect(() => {
    if (selectedDrone) {
      setCenterOnSelection({ lat: selectedDrone.lat, lng: selectedDrone.lng });
    } else {
      setCenterOnSelection(undefined);
    }
    // Intentionally depend only on selectedDroneId so we don't fly on every position update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDroneId]);
  useFlyTo(centerOnSelection, { zoom: 14, duration: 1500 });
  return null;
}
