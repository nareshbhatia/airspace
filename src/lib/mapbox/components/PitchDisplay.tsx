import { useEffect, useState } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Field, FieldLabel } from '../../../components/ui/field';
import { useMap } from '../hooks/useMap';
import { useMapEvent } from '../hooks/useMapEvent';

interface PitchDisplayProps {
  className?: string;
}

/**
 * Displays the current map pitch (tilt) in degrees.
 * Intended to be rendered inside a MapPanel.
 */
export function PitchDisplay({ className }: PitchDisplayProps) {
  const { map } = useMap();
  const [pitch, setPitch] = useState<number>(0);

  useEffect(() => {
    if (!map) return;
    const id = requestAnimationFrame(() => setPitch(map.getPitch()));
    return () => cancelAnimationFrame(id);
  }, [map]);

  useMapEvent('pitch', () => {
    if (map) setPitch(map.getPitch());
  });

  if (!map) return null;

  return (
    <Field orientation="horizontal" className={className}>
      <FieldLabel>Pitch</FieldLabel>
      <Badge variant="outline">{Math.round(pitch)}°</Badge>
    </Field>
  );
}
