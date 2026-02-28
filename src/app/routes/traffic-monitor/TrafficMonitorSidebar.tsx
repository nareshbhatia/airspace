import { AirportTypeahead } from './AirportTypeahead';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { airportById } from '../../../gen/airports';

interface TrafficMonitorSidebarProps {
  selectedAirportId?: string;
  onAirportChange: (airportId: string | undefined) => void;
}

/**
 * Left sidebar for the Traffic Monitor: airport filter and flight list.
 */
function TrafficMonitorSidebar({
  selectedAirportId,
  onAirportChange,
}: TrafficMonitorSidebarProps) {
  const selectedAirport = selectedAirportId
    ? airportById.get(selectedAirportId)
    : undefined;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border px-3 py-2">
        <div className="text-sm font-medium text-foreground">Filter</div>
        <AirportTypeahead
          className="mt-2"
          selectedAirportId={selectedAirportId}
          onAirportChange={onAirportChange}
        />
        {selectedAirport ? (
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
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Select an airport to view traffic
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="border-b border-border px-3 py-2 text-sm font-medium text-foreground">
          Flights
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <p className="text-sm text-muted-foreground">No flights to display</p>
        </div>
      </div>
    </aside>
  );
}

export { TrafficMonitorSidebar };
