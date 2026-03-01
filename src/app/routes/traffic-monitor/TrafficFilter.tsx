import { useCallback, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { AirportTypeahead } from './AirportTypeahead';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { airportById } from '../../../gen/airports';

const RADIUS_MILES_MIN = 1;
const RADIUS_MILES_MAX = 1000;

interface TrafficFilterProps {
  selectedAirportId?: string;
  onAirportChange: (airportId: string | undefined) => void;
  radiusMiles: number;
  onRadiusChange: (radius: number) => void;
}

/**
 * Filter section for the Traffic Monitor: airport typeahead, selected airport
 * display, and search radius selector.
 */
export function TrafficFilter({
  selectedAirportId,
  onAirportChange,
  radiusMiles,
  onRadiusChange,
}: TrafficFilterProps) {
  const selectedAirport = selectedAirportId
    ? airportById.get(selectedAirportId)
    : undefined;

  const [inputValue, setInputValue] = useState(String(radiusMiles));
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);

  const commitRadius = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed === '') {
        setInvalidMessage(
          `Enter a number between ${RADIUS_MILES_MIN} and ${RADIUS_MILES_MAX}`,
        );
        return;
      }
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isNaN(parsed)) {
        setInvalidMessage(
          `Enter a number between ${RADIUS_MILES_MIN} and ${RADIUS_MILES_MAX}`,
        );
        return;
      }
      const clamped = Math.min(
        RADIUS_MILES_MAX,
        Math.max(RADIUS_MILES_MIN, parsed),
      );
      setInvalidMessage(null);
      setInputValue(String(clamped));
      onRadiusChange(clamped);
    },
    [onRadiusChange],
  );

  const debouncedCommit = useDebouncedCallback(commitRadius, 1000);

  const handleRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputValue(raw);
      debouncedCommit(raw);
    },
    [debouncedCommit],
  );

  return (
    <div className="border-b border-border px-3 py-2">
      <div className="text-sm font-medium text-foreground">Filter</div>
      <AirportTypeahead
        className="mt-2"
        selectedAirportId={selectedAirportId}
        onAirportChange={onAirportChange}
      />
      {selectedAirport ? (
        <>
          <Card className="mt-2" size="sm">
            <CardHeader className="min-w-0">
              <CardTitle>{selectedAirport.id}</CardTitle>
              <CardDescription className="min-w-0">
                <span
                  className="block min-w-0 truncate"
                  title={selectedAirport.name}
                >
                  {selectedAirport.name}
                </span>
                <span className="block">
                  {selectedAirport.municipality}, {selectedAirport.iso_country}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="mt-2" key={selectedAirportId}>
            <div className="text-xs text-muted-foreground mb-1.5">
              Search radius
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleRadiusChange}
                aria-label="Search radius in miles"
                className="w-20 text-right"
                aria-invalid={invalidMessage !== null}
                aria-describedby={invalidMessage ? 'radius-error' : undefined}
              />
              <span className="text-xs text-muted-foreground">mi</span>
            </div>
            {invalidMessage ? (
              <p
                id="radius-error"
                className="mt-1 text-xs text-destructive"
                role="alert"
              >
                {invalidMessage}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Select an airport to view traffic
        </p>
      )}
    </div>
  );
}
