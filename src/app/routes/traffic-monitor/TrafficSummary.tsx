interface TrafficSummaryProps {
  selectedAirportId?: string;
  loading: boolean;
  aircraftCount: number;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Traffic summary in the Traffic Monitor sidebar:
 * - primary line: Flights Header / Loading / Aircraft Count
 * - optional second line: Error / Last Updated Time
 */
export function TrafficSummary({
  selectedAirportId,
  loading,
  aircraftCount,
  error,
  lastUpdated,
}: TrafficSummaryProps) {
  return (
    <div
      className="border-b border-border px-3 py-2 text-sm font-medium text-foreground"
      role="status"
      aria-live="polite"
    >
      {selectedAirportId ? (
        loading && aircraftCount === 0 ? (
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full bg-primary animate-pulse"
              aria-hidden
            />
            Loading…
          </span>
        ) : (
          `${aircraftCount} aircraft in search area`
        )
      ) : (
        'Flights'
      )}
      {selectedAirportId && (
        <div className="mt-0.5 text-xs font-normal text-muted-foreground">
          {error ? (
            <span className="text-destructive">
              Unable to fetch traffic data — retrying
            </span>
          ) : loading ? (
            <>Please standby</>
          ) : lastUpdated ? (
            <>Updated {lastUpdated.toLocaleTimeString()}</>
          ) : null}
        </div>
      )}
    </div>
  );
}
