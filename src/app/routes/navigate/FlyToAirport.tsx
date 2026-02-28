import { airportById } from '../../../data/airports';
import { useFlyTo } from '../../../lib/mapbox';

interface FlyToAirportProps {
  selectedAirportId?: string;
}

export function FlyToAirport({ selectedAirportId }: FlyToAirportProps) {
  const selectedAirport = selectedAirportId
    ? airportById.get(selectedAirportId)
    : undefined;
  useFlyTo(selectedAirport?.coordinates, { zoom: 14, duration: 2000 });
  return null;
}
