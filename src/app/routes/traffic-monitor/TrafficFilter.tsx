import { AirportTypeahead } from './AirportTypeahead';
import { RADIUS_MILES_VALUES } from './types';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { airportById } from '../../../gen/airports';

import type { RadiusMiles } from './types';

interface TrafficFilterProps {
  selectedAirportId?: string;
  onAirportChange: (airportId: string | undefined) => void;
  radiusMiles: RadiusMiles;
  onRadiusChange: (radius: RadiusMiles) => void;
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
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1.5">
              Search radius
            </div>
            <div className="flex gap-0 rounded-md border border-border overflow-hidden">
              {RADIUS_MILES_VALUES.map((r) => (
                <Button
                  key={r}
                  variant={radiusMiles === r ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 rounded-none border-0 first:border-r last:border-l border-border"
                  onClick={() => onRadiusChange(r)}
                >
                  {r} mi
                </Button>
              ))}
            </div>
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
