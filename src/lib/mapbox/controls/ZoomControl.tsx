import { useCallback, useEffect, useState } from 'react';

import { Minus, Plus } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import {
  ButtonGroup,
  ButtonGroupText,
} from '../../../components/ui/button-group';
import { cn } from '../../../utils/cn';
import { useMap } from '../hooks/useMap';
import { useMapEvent } from '../hooks/useMapEvent';

interface ZoomControlProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const POSITION_CLASSES = {
  'top-right': 'top-3 right-3',
  'top-left': 'top-3 left-3',
  'bottom-right': 'bottom-3 right-3',
  'bottom-left': 'bottom-3 left-3',
} as const;

/**
 * Map control that provides zoom in/out buttons and displays the current zoom level.
 * Must be used inside a MapProvider.
 */
export function ZoomControl({
  className,
  position = 'top-right',
}: ZoomControlProps) {
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

  const handleZoomIn = useCallback(() => {
    map?.zoomIn();
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomOut();
  }, [map]);

  if (!map) return null;

  const positionClasses = POSITION_CLASSES[position];

  return (
    <ButtonGroup
      orientation="vertical"
      aria-label="Zoom control"
      className={cn('absolute z-10 h-fit', positionClasses, className)}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomIn}
        aria-label="Zoom in"
      >
        <Plus />
      </Button>
      <ButtonGroupText
        className="min-h-8 px-0 justify-center"
        aria-label="Current zoom level"
      >
        {Math.round(zoom)}
      </ButtonGroupText>
      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomOut}
        aria-label="Zoom out"
      >
        <Minus />
      </Button>
    </ButtonGroup>
  );
}
