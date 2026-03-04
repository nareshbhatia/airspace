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
  const center = selectedDrone
    ? { lat: selectedDrone.lat, lng: selectedDrone.lng }
    : undefined;
  useFlyTo(center, { zoom: 14, duration: 1500 });
  return null;
}
