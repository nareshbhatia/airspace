import { airportById } from '../../../data/airports';
import { useFlyTo } from '../../../lib/mapbox';

interface FlyToAirportProps {
  airportId: string | null;
}

export function FlyToAirport({ airportId }: FlyToAirportProps) {
  const airport = airportId ? airportById.get(airportId) : null;
  useFlyTo(airport?.coordinates ?? null, { zoom: 14, duration: 2000 });
  return null;
}
