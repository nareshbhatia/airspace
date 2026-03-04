import { EMPTY, interval, merge, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import telemetryData from '../gen/telemetry.json';
import { droneStore } from '../stores/droneStore';
import { playbackStore } from '../stores/playbackStore';

import type { DroneService } from './DroneService';

/** One frame from the recorded telemetry stream. */
interface TelemetryFrame {
  droneId: string;
  timestamp: number;
  lat: number;
  lng: number;
  heading: number;
}

const frames = telemetryData as TelemetryFrame[];

/**
 * DroneService implementation: 10 Hz playback from recorded telemetry,
 * bridge to vanilla Zustand stores. Zero React imports.
 */
export class DroneServiceImpl implements DroneService {
  /** Emitted only in onDestroy; stops all subscriptions so the service can unmount without leaks. */
  private readonly destroy$ = new Subject<void>();

  /** Per playback run: emitted on pause so we can start a new interval on play(). New Subject each startPlayback(). */
  private runStop$: Subject<void> | null = null;

  /** Index into frames; advances as we consume frames. Reset to 0 on reset(). */
  private frameIndex = 0;

  /** Frames from the recorded telemetry stream. */
  private readonly frames = frames;

  /** Called once when the provider mounts. Auto-starts playback and the 10 Hz interval. */
  onInit(): void {
    playbackStore.getState().play();
    this.startPlayback();
  }

  /** Called once when the provider unmounts. Stops current run and completes destroy$ so all subscriptions end. */
  onDestroy(): void {
    if (this.runStop$) {
      this.runStop$.next();
      this.runStop$.complete();
      this.runStop$ = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Starts a new interval subscription. Stops when runStop$ (pause) or destroy$ (unmount) emits. */
  private startPlayback(): void {
    this.runStop$ = new Subject<void>();
    const initialElapsedMs = playbackStore.getState().elapsedMs;

    interval(100)
      .pipe(
        takeUntil(merge(this.runStop$, this.destroy$)),
        catchError((error: unknown) => {
          console.error('[DroneService] playback stream failed', error);
          return EMPTY;
        }),
      )
      .subscribe((tick: number) => {
        // initialElapsedMs lets us resume from current position after pause (tick is 0,1,2... from this run).
        const elapsedMs = initialElapsedMs + tick * 100;

        // Emit every frame whose timestamp has been reached (chronological order; may be 0–3 frames per tick).
        while (
          this.frameIndex < this.frames.length &&
          this.frames[this.frameIndex].timestamp <= elapsedMs
        ) {
          const frame = this.frames[this.frameIndex];
          this.frameIndex += 1;

          droneStore.getState()._updateDrone(frame.droneId, {
            lat: frame.lat,
            lng: frame.lng,
            heading: frame.heading,
            lastUpdatedAt: Date.now(),
          });
        }

        playbackStore.getState()._tick(elapsedMs);
      });
  }

  /** Resume playback. Idempotent: only starts a new interval if not already playing. */
  play(): void {
    if (!playbackStore.getState().isPlaying) {
      playbackStore.getState().play();
      this.startPlayback();
    }
  }

  /** Stop the interval (runStop$) and set isPlaying false. Frame index and elapsedMs are preserved for resume. */
  pause(): void {
    if (this.runStop$) {
      this.runStop$.next();
      this.runStop$.complete();
      this.runStop$ = null;
    }
    playbackStore.getState().pause();
  }

  /** Pause, rewind to start, reset store elapsedMs, then play from the beginning. */
  reset(): void {
    this.pause();
    this.frameIndex = 0;
    playbackStore.getState().reset();
    this.play();
  }
}
