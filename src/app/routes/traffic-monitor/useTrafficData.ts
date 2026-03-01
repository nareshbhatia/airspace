import { useCallback, useEffect, useState } from 'react';

import { fetchStateVectors, mapStateVectorsToAircraft } from './api/opensky';

import type { Aircraft } from './types';
import type { BoundingBox } from './utils/boundingBox';

const POLL_INTERVAL_MS = 10_000;

export interface UseTrafficDataResult {
  aircraft: Aircraft[];
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
  clear: () => void;
}

/**
 * Fetches OpenSky traffic data for the given bounding box. When boundingBox
 * is null, no fetch runs and no polling occurs. When boundingBox is set,
 * fetches immediately then every 10 seconds. Call clear() when the user
 * clears the airport so aircraft/error/lastUpdated are reset.
 */
export function useTrafficData(
  boundingBox: BoundingBox | null,
): UseTrafficDataResult {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setAircraft([]);
    setLastUpdated(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (boundingBox === null) return;

    let cancelled = false;

    const fetchData = async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchStateVectors(boundingBox);
        if (cancelled) return;
        const list = mapStateVectorsToAircraft(response.states);
        setAircraft(list);
        setLastUpdated(new Date(response.time * 1000));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Unable to fetch traffic data',
        );
        setAircraft([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    const intervalId = setInterval(() => {
      void fetchData();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [boundingBox]);

  return { aircraft, lastUpdated, loading, error, clear };
}
