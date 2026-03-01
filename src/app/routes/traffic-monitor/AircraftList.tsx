import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';

import type { Aircraft } from './types';

interface AircraftListProps {
  aircraft: Aircraft[];
}

/**
 * Scrollable list of aircraft cards showing callsign, altitude, velocity,
 * heading, and phase of flight.
 */
function AircraftList({ aircraft }: AircraftListProps) {
  return (
    <ul className="flex flex-col gap-2 list-none p-0 m-0">
      {aircraft.map((a) => (
        <li key={a.icao24}>
          <Card size="sm" className="py-2">
            <CardHeader className="min-w-0 py-0">
              <CardTitle className="text-sm font-medium truncate">
                {a.callsign}
              </CardTitle>
              <CardDescription className="min-w-0 text-xs flex flex-wrap gap-x-3 gap-y-0.5">
                <span>{Math.round(a.altitudeFt)} ft</span>
                <span>{Math.round(a.velocityKts)} kts</span>
                <span>{Math.round(a.headingDeg)}°</span>
                <span>{a.phase}</span>
              </CardDescription>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export { AircraftList };
