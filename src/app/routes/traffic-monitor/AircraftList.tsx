import { useEffect, useRef } from 'react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { cn } from '../../../utils/cn';

import type { Aircraft } from './types';

interface AircraftListProps {
  aircraft: Aircraft[];
  selectedAircraftId?: string;
  onAircraftSelect: (icao24: string) => void;
}

/**
 * Scrollable list of aircraft cards showing callsign, altitude, velocity,
 * heading, and phase of flight. Clicking a card selects that aircraft.
 * The list scrolls to keep the selected card in view when selection changes.
 */
function AircraftList({
  aircraft,
  selectedAircraftId,
  onAircraftSelect,
}: AircraftListProps) {
  const selectedCardRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (selectedAircraftId && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedAircraftId]);

  return (
    <ul className="flex flex-col gap-2 list-none p-0 m-0">
      {aircraft.map((a) => {
        const isSelected = selectedAircraftId === a.icao24;
        return (
          <li
            key={a.icao24}
            ref={(el) => {
              if (isSelected) selectedCardRef.current = el;
              else if (selectedCardRef.current === el)
                selectedCardRef.current = null;
            }}
          >
            <Card
              size="sm"
              className={cn(
                'py-2 cursor-pointer transition-shadow',
                isSelected && 'ring-2 ring-primary',
              )}
              onClick={() => onAircraftSelect(a.icao24)}
            >
              <CardHeader className="min-w-0 py-0">
                <CardTitle className="text-sm font-medium truncate">
                  {a.callsign || 'Unknown'}
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
        );
      })}
    </ul>
  );
}

export { AircraftList };
