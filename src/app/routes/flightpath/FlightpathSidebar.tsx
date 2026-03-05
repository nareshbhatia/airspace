import { useCallback } from 'react';

import { CirclePause, CirclePlay, Rewind } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { DroneCard } from './DroneCard';
import { Button } from '../../../components/ui/button';
import { useDroneService } from '../../../providers/DroneServiceProvider/useDroneService';
import { useDroneStore } from '../../../stores/droneStore';
import { usePlaybackStore } from '../../../stores/playbackStore';
import { cn } from '../../../utils/cn';

interface FlightpathSidebarProps {
  className?: string;
}

/**
 * Left sidebar: title, playback status, scrollable drone list, playback controls.
 * Commands go through useDroneService(); state is read from stores only.
 */
export function FlightpathSidebar({ className }: FlightpathSidebarProps) {
  const droneService = useDroneService();
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const elapsedMs = usePlaybackStore((state) => state.elapsedMs);
  const droneIds = useDroneStore(
    useShallow((state) => Array.from(state.drones.keys())),
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      droneService.pause();
    } else {
      droneService.play();
    }
  }, [droneService, isPlaying]);

  const handleReset = useCallback(() => {
    droneService.reset();
  }, [droneService]);

  const elapsedSec = Math.floor(elapsedMs / 1000);

  return (
    <aside
      className={cn(
        'flex flex-col border-border border-r bg-card overflow-hidden',
        className,
      )}
    >
      <header className="flex flex-col gap-2 border-b px-3 py-3">
        <h1 className="font-semibold">Flightpath</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <CirclePause /> : <CirclePlay />}
            </Button>
            <p className="font-mono text-xs">{elapsedSec}s</p>
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleReset}
            aria-label="Reset to start"
          >
            <Rewind />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {droneIds.map((id) => (
          <DroneCard key={id} droneId={id} />
        ))}
      </div>
    </aside>
  );
}
