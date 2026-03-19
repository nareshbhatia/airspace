import { useEffect, useState } from 'react';

import { cn } from '../../../utils/cn';
import { useMap } from '../hooks/useMap';
import { useMapEvent } from '../hooks/useMapEvent';

interface ZoomLevelDisplayProps {
  className?: string;
}

/**
 * Displays the current map zoom level.
 * Intended to be rendered inside a MapPanel.
 */
export function ZoomLevelDisplay({ className }: ZoomLevelDisplayProps) {
  const { map } = useMap();
  const [zoom, setZoom] = useState<number>(0);

  useEffect(() => {
    if (!map) return;
    const id = requestAnimationFrame(() => setZoom(map.getZoom()));
    return () => cancelAnimationFrame(id);
  }, [map]);

  useMapEvent('zoom', () => {
    if (map) setZoom(map.getZoom());
  });

  if (!map) return null;

  return (
    <div
      aria-label="Current zoom level"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium',
        className,
      )}
    >
      {Math.round(zoom)}
    </div>
  );
}
