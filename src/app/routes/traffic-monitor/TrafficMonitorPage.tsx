import { MapProvider } from '../../../lib/mapbox';

/**
 * Traffic Monitor page for viewing traffic-related data.
 */
export function TrafficMonitorPage() {
  return (
    <div className="relative flex flex-1 min-h-0">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-background">
        <div className="border-b border-border px-3 py-2">
          <div className="text-sm font-medium text-foreground">Filter</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Select an airport to view traffic
          </p>
        </div>
        <div className="min-h-0 flex-1 flex flex-col">
          <div className="border-b border-border px-3 py-2 text-sm font-medium text-foreground">
            Flights
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            <p className="text-sm text-muted-foreground">
              No flights to display
            </p>
          </div>
        </div>
      </aside>
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style="mapbox://styles/mapbox/dark-v11"
          center={[-98.5, 39.8]}
          zoom={4}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
