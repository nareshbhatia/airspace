import { useEffect, useState } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Field, FieldLabel } from '../../../components/ui/field';
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
    <Field orientation="horizontal" className={className}>
      <FieldLabel>Zoom</FieldLabel>
      <Badge variant="outline">{Math.round(zoom)}</Badge>
    </Field>
  );
}
