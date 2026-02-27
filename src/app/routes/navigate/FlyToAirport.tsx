import { airportById } from '../../../data/airports';
import { useFlyTo } from '../../../lib/mapbox';

interface FlyToAirportProps {
  selectedAirportId: string | null;
}

export function FlyToAirport({ selectedAirportId }: FlyToAirportProps) {
  const selectedAirport = selectedAirportId
    ? airportById.get(selectedAirportId)
    : null;
  useFlyTo(selectedAirport?.coordinates ?? null, { zoom: 14, duration: 2000 });
  return null;
}
