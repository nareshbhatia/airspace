import { AircraftList } from './AircraftList';
import { TrafficFilter } from './TrafficFilter';
import { TrafficSummary } from './TrafficSummary';

import type { Aircraft } from './types';

interface TrafficMonitorSidebarProps {
  selectedAirportId?: string;
  onAirportChange: (airportId: string | undefined) => void;
  radiusMiles: number;
  onRadiusChange: (radius: number) => void;
  aircraft: Aircraft[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Left sidebar for the Traffic Monitor: airport filter and flight list.
 */
export function TrafficMonitorSidebar({
  selectedAirportId,
  onAirportChange,
  radiusMiles,
  onRadiusChange,
  aircraft,
  loading,
  error,
  lastUpdated,
}: TrafficMonitorSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-background">
      <TrafficFilter
        selectedAirportId={selectedAirportId}
        onAirportChange={onAirportChange}
        radiusMiles={radiusMiles}
        onRadiusChange={onRadiusChange}
      />
      <div className="min-h-0 flex-1 flex flex-col">
        <TrafficSummary
          selectedAirportId={selectedAirportId}
          loading={loading}
          aircraftCount={aircraft.length}
          error={error}
          lastUpdated={lastUpdated}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {!selectedAirportId ? (
            <p className="text-sm text-muted-foreground">
              Select an airport to view traffic
            </p>
          ) : loading && aircraft.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : aircraft.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No aircraft in search area
            </p>
          ) : (
            <AircraftList aircraft={aircraft} />
          )}
        </div>
      </div>
    </aside>
  );
}
