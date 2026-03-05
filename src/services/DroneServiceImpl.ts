/**
 * Drone Service Implementation — Simulation Mode
 * ================================================
 *
 * Drives an infinite V-formation telemetry stream and bridges it to the
 * Zustand stores that React components read from. This is the heart of
 * the stress-test architecture:
 *
 *   ┌───────────────────────┐
 *   │  TelemetryGenerator   │  Pure computation: formation math
 *   │  (tick → DroneState[])│
 *   └──────────┬────────────┘
 *              │ called every periodMs
 *   ┌──────────▼───────────┐
 *   │   DroneServiceImpl   │  This file: RxJS interval + store bridge
 *   │  (interval → tick    │
 *   │   → batch update)    │
 *   └──────────┬───────────┘
 *              │ _updateDrones() — single Zustand transaction
 *   ┌──────────▼───────────┐
 *   │   Zustand Stores     │  droneStore (drone positions)
 *   │                      │  playbackStore (isPlaying, elapsedMs)
 *   └──────────┬───────────┘
 *              │ useDroneStore() — selective subscriptions
 *   ┌──────────▼───────────┐
 *   │  React Components    │  Map, drone list, FPS meter, etc.
 *   └──────────────────────┘
 *
 * Stress Test Parameters:
 *   The two axes of the stress test are controlled via SimulationConfig:
 *     - droneCount: how many drones in the formation (50, 100, 200, 500, 1000)
 *     - tickRateHz: how often telemetry is generated (1, 5, 10, 20 Hz)
 *   Together these determine the volume of data flowing through the pipeline.
 *   At 500 drones × 20 Hz = 10,000 drone state updates per second, all
 *   funneled through a single Zustand batch update per tick.
 *
 * RxJS Lifecycle Management:
 *   The service uses two Subjects to manage the RxJS interval subscription:
 *
 *     destroy$ — Emitted once in onDestroy() when the React provider unmounts.
 *       This is the ultimate kill switch. Every subscription uses
 *       takeUntil(destroy$) so there are zero leaks on unmount.
 *
 *     runStop$ — Emitted on pause(). This stops the current interval run
 *       without destroying the service. A new runStop$ is created on each
 *       play(), so the service can be paused and resumed indefinitely.
 *
 *   The interval pipeline: interval(periodMs) → takeUntil(merge(runStop$, destroy$))
 *   This means the interval stops if EITHER pause or unmount occurs.
 *
 * Elapsed Time Tracking:
 *   The playbackStore.elapsedMs is computed as:
 *     elapsedMs = initialElapsedMs + (tick + 1) * periodMs
 *   where initialElapsedMs is captured at the start of each play() run and
 *   tick is the 0-indexed value from interval(periodMs) (0, 1, 2, ...). The
 *   (tick + 1) is required because the first emission (tick = 0) occurs
 *   after one period has elapsed, the second after two periods, and so on.
 *   This allows pause/resume to continue the timer seamlessly:
 *     - User plays for 5s → pauses → elapsedMs = 5000
 *     - User resumes → initialElapsedMs = 5000, tick starts at 0
 *     - After 3 more seconds (30 ticks) → elapsedMs = 5000 + 30 * 100 = 8000
 */

import { EMPTY, interval, merge, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { createTelemetryGenerator } from './formation-telemetry-generator';
import { droneStore } from '../stores/droneStore';
import { playbackStore } from '../stores/playbackStore';

import type { DroneService } from './DroneService';
import type {
  FormationConfig,
  TelemetryGenerator,
} from './formation-telemetry-generator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for the simulation service.
 *
 * Extends FormationConfig (drone count, speed, heading, spacing) with
 * the tick rate, which together with droneCount forms the two axes of
 * the stress test.
 */
export interface SimulationConfig extends FormationConfig {
  /**
   * Telemetry tick rate in Hz (ticks per second).
   *
   * This single value drives both:
   *   1. The RxJS interval period: `interval(1000 / tickRateHz)`
   *   2. The time delta passed to the generator: `generator.tick(1000 / tickRateHz)`
   *
   * These MUST stay coupled — if the interval fires every 50ms but you
   * pass tick(100), the formation will move at double speed.
   *
   * Higher tick rates mean more frequent store updates and React renders.
   * This is one of the two stress test axes (the other being droneCount).
   *
   * Suggested test values: 1, 5, 10, 20 Hz
   *
   * Examples:
   *   - 10 Hz → interval(100ms) → generator.tick(100) → 10 store updates/sec
   *   - 20 Hz → interval(50ms)  → generator.tick(50)  → 20 store updates/sec
   */
  tickRateHz: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class DroneServiceImpl implements DroneService {
  /**
   * Emitted once in onDestroy(). Stops ALL subscriptions.
   * Every observable pipeline includes takeUntil(destroy$) to prevent leaks.
   */
  private readonly destroy$ = new Subject<void>();

  /**
   * Emitted on pause() to stop the current interval run.
   * A new Subject is created on each play()/startPlayback() call,
   * allowing the service to be paused and resumed indefinitely.
   * Set to null when no interval is running.
   */
  private runStop$: Subject<void> | null = null;

  /** The telemetry generator that produces DroneState[] on each tick */
  private readonly generator: TelemetryGenerator;

  /**
   * Interval period in milliseconds, derived from tickRateHz.
   * Used for both the RxJS interval and the generator.tick() dtMs argument.
   */
  private readonly periodMs: number;

  /**
   * @param config - Simulation parameters. Passed to the telemetry generator
   *   for formation setup, and used here for tick rate configuration.
   *
   * Example:
   *   new DroneServiceImpl({
   *     droneCount: 225,       // 15² = 15 rows in the wedge
   *     speed: 50,             // 50 m/s
   *     heading: 45,           // northeast
   *     initialLat: 37.77,
   *     initialLng: -122.42,
   *     lateralSpacing: 50,    // 50m between drones in a row
   *     depthOffset: 30,       // 30m between rows
   *     tickRateHz: 10,        // 10 telemetry updates per second
   *   });
   */
  constructor(config: SimulationConfig) {
    this.generator = createTelemetryGenerator(config);
    this.periodMs = 1000 / config.tickRateHz;
  }

  /**
   * Called once when the React provider mounts (Service.onInit).
   * Auto-starts the simulation immediately.
   */
  onInit(): void {
    playbackStore.getState().play();
    this.startPlayback();
  }

  /**
   * Called once when the React provider unmounts (Service.onDestroy).
   *
   * Cleanup sequence:
   *   1. Stop the current interval run (if any) via runStop$
   *   2. Complete destroy$ to stop any remaining subscriptions
   *   3. Complete both Subjects so they can be garbage collected
   */
  onDestroy(): void {
    if (this.runStop$) {
      this.runStop$.next();
      this.runStop$.complete();
      this.runStop$ = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Starts a new RxJS interval that drives the telemetry loop.
   *
   * On each tick:
   *   1. generator.tick(periodMs) — advances the formation and returns DroneState[]
   *   2. droneStore._updateDrones(states) — batch-updates the store in one transaction
   *   3. playbackStore._tick(elapsedMs) — updates the elapsed time for the UI
   *
   * The interval automatically stops when either:
   *   - runStop$ emits (user pressed pause)
   *   - destroy$ emits (provider unmounted)
   *
   * Error handling: catchError logs and returns EMPTY, preventing a single
   * error from killing the entire subscription. In practice, the generator
   * is pure math and shouldn't throw, but this protects against edge cases.
   */
  private startPlayback(): void {
    this.runStop$ = new Subject<void>();

    // Capture the current elapsed time so we can continue from here
    // after a pause/resume cycle (tick number resets to 0 on each run).
    const initialElapsedMs = playbackStore.getState().elapsedMs;

    interval(this.periodMs)
      .pipe(
        takeUntil(merge(this.runStop$, this.destroy$)),
        catchError((error: unknown) => {
          console.error('[DroneService] simulation stream failed', error);
          return EMPTY;
        }),
      )
      .subscribe((tick: number) => {
        // 1. Generate telemetry for all drones at this time step
        const states = this.generator.tick(this.periodMs);

        // 2. Batch-update the drone store (single Map copy, single set() call)
        droneStore.getState()._updateDrones(states);

        // 3. Update elapsed time for UI display
        //    tick is 0-indexed; when tick = n, (n+1) periods have elapsed.
        const elapsedMs = initialElapsedMs + (tick + 1) * this.periodMs;
        playbackStore.getState()._tick(elapsedMs);
      });
  }

  /**
   * Resume the simulation.
   *
   * Idempotent — if already playing, this is a no-op. Otherwise:
   *   1. Sets playbackStore.isPlaying = true
   *   2. Starts a new interval from the current elapsed time
   */
  play(): void {
    if (!playbackStore.getState().isPlaying) {
      playbackStore.getState().play();
      this.startPlayback();
    }
  }

  /**
   * Pause the simulation.
   *
   * Stops the current RxJS interval by emitting on runStop$.
   * The generator's internal leader position is preserved, so
   * play() will resume from exactly where we left off.
   * The playbackStore.elapsedMs is also preserved for the same reason.
   */
  pause(): void {
    if (this.runStop$) {
      this.runStop$.next();
      this.runStop$.complete();
      this.runStop$ = null;
    }
    playbackStore.getState().pause();
  }

  /**
   * Reset the simulation to its initial state and restart.
   *
   * Sequence:
   *   1. Pause the current interval
   *   2. Reset the generator (leader returns to initial lat/lng)
   *   3. Clear all drones from the store (removes stale markers from the map)
   *   4. Reset the playback timer to 0
   *   5. Auto-play from the beginning
   */
  reset(): void {
    this.pause();
    this.generator.reset();
    droneStore.getState()._clearDrones();
    playbackStore.getState().reset();
    this.play();
  }
}
