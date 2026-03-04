import { useCallback } from 'react';

import { Pause, Play, SkipBack } from 'lucide-react';
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
  const isAtEnd = usePlaybackStore((state) => state.isAtEnd);
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

  const statusLabel = isAtEnd
    ? 'Stream ended'
    : isPlaying
      ? 'Stream playing'
      : 'Stream paused';

  return (
    <aside
      className={cn(
        'flex flex-col border-border border-r bg-card overflow-hidden',
        className,
      )}
    >
      <header className="shrink-0 border-border border-b px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-foreground text-sm font-semibold tracking-tight">
              Flightpath
            </h1>
            <p
              className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1.5"
              aria-label={statusLabel}
            >
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  isAtEnd && 'bg-destructive',
                  !isAtEnd && isPlaying && 'bg-success animate-pulse',
                  !isAtEnd && !isPlaying && 'bg-warning',
                )}
                aria-hidden
              />
              <span>
                {isAtEnd ? 'Ended' : isPlaying ? 'Playing' : 'Paused'}
              </span>
              <span className="font-mono tabular-nums text-foreground/80">
                {elapsedSec}s
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleReset}
              aria-label="Reset to start"
            >
              <SkipBack className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
            </Button>
          </div>
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
