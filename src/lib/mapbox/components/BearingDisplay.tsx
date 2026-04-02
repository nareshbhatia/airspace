import { useEffect, useState } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Field, FieldLabel } from '../../../components/ui/field';
import { useMap } from '../hooks/useMap';
import { useMapEvent } from '../hooks/useMapEvent';

interface BearingDisplayProps {
  className?: string;
}

/**
 * Displays the current map bearing in degrees.
 * Intended to be rendered inside a MapPanel.
 */
export function BearingDisplay({ className }: BearingDisplayProps) {
  const { map } = useMap();
  const [bearing, setBearing] = useState<number>(0);

  useEffect(() => {
    if (!map) return;
    const id = requestAnimationFrame(() => setBearing(map.getBearing()));
    return () => cancelAnimationFrame(id);
  }, [map]);

  useMapEvent('rotate', () => {
    if (map) setBearing(map.getBearing());
  });

  if (!map) return null;

  return (
    <Field orientation="horizontal" className={className}>
      <FieldLabel>Bearing</FieldLabel>
      <Badge variant="outline">{Math.round(bearing)}°</Badge>
    </Field>
  );
}
