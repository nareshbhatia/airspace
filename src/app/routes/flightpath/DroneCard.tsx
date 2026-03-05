import { useCallback } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { useDroneStore } from '../../../stores/droneStore';
import { cn } from '../../../utils/cn';

import type { DroneStoreState } from '../../../stores/droneStore';

interface DroneCardProps {
  droneId: string;
}

/**
 * Card for a single drone in the sidebar. Subscribes to this drone only; re-renders
 * when this drone's data changes (store replaces one entry per tick, so reference equality is enough).
 * Click selects the drone (UI state).
 */
export function DroneCard({ droneId }: DroneCardProps) {
  const selector = useCallback(
    (state: DroneStoreState) => state.drones.get(droneId),
    [droneId],
  );
  const drone = useDroneStore(selector);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);

  const handleClick = useCallback(() => {
    selectDrone(droneId);
  }, [selectDrone, droneId]);

  if (drone === undefined) {
    return null;
  }

  const isSelected = selectedDroneId === droneId;

  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer transition-colors shrink-0',
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="text-foreground">{drone.callSign}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        <div className="font-mono tabular-nums">
          {drone.lat.toFixed(4)}, {drone.lng.toFixed(4)}
        </div>
        <div>
          Heading{' '}
          <span className="font-mono tabular-nums">
            {Math.round(drone.heading)}°
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
