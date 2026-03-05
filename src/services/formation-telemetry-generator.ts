/**
 * Wedge Formation Telemetry Generator
 * ====================================
 *
 * Generates synthetic drone telemetry for a wedge formation of aircraft
 * flying in a straight line at a constant speed and heading. Designed
 * to stress-test the Airspace frontend rendering pipeline by producing
 * configurable volumes of telemetry data.
 *
 * Wedge Formation:
 *   Unlike a V-formation (which only has drones on the edges), a wedge
 *   formation fills the entire triangle. Each row is a line of evenly
 *   spaced drones centered behind the leader, getting progressively wider:
 *
 *     Row 1:  1 drone   (the leader)
 *     Row 2:  3 drones
 *     Row 3:  5 drones
 *     Row r:  (2r - 1) drones
 *
 *   Total drones for r rows = r² (sum of first r odd numbers).
 *
 *   Reference table:
 *      5 rows →   25 drones
 *     10 rows →  100 drones
 *     15 rows →  225 drones
 *     20 rows →  400 drones
 *     25 rows →  625 drones
 *     32 rows → 1024 drones
 *
 *   The caller should specify droneCount as a perfect square (r²) to
 *   produce a complete wedge. The number of rows is derived as √droneCount.
 *
 * This module is pure computation — no RxJS, no timers, no store coupling.
 * It exposes a `tick(dtMs)` method that the caller (DroneServiceImpl)
 * invokes at whatever frequency the stress test requires.
 *
 * Architecture:
 *   1. FormationConfig — input parameters (drone count, speed, heading, etc.)
 *   2. generateFormation() — computes static (x, y) offsets for each drone
 *      relative to the leader, based on the wedge geometry.
 *   3. createTelemetryGenerator() — returns a TelemetryGenerator with:
 *        - tick(dtMs): advance the leader, compute all drone positions, return DroneState[]
 *        - reset(): move the leader back to the initial position
 *        - getLeaderPosition(): return the leader's current lat/lng
 *
 * Coordinate System:
 *   The formation is defined in a local coordinate system centered on the leader:
 *     - x axis: lateral (positive = right of heading direction)
 *     - y axis: longitudinal (positive = forward along heading direction)
 *   These local offsets are rotated by the formation heading and converted to
 *   lat/lng using a flat-earth approximation (sufficient for the scale of a
 *   drone formation, where errors are sub-millimeter).
 */

import type { DroneState } from '../stores/droneStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormationConfig {
  /**
   * Number of drones in the formation.
   *
   * Should be a perfect square (r²) to produce a complete wedge:
   *   25, 49, 100, 225, 400, 625, 1024, etc.
   *
   * The number of rows is derived as √droneCount. If droneCount is not
   * a perfect square, the generator will use floor(√droneCount) rows
   * and ignore the remaining drones — so always pass r² for clean results.
   */
  droneCount: number;

  /** Speed of the entire formation in meters per second */
  speed: number;

  /**
   * Compass heading in degrees (0 = north, 90 = east, 180 = south, 270 = west).
   * The entire formation moves in this direction. The wedge trails behind
   * the leader, widening opposite to the heading.
   */
  heading: number;

  /** Leader's initial latitude in decimal degrees */
  initialLat: number;

  /** Leader's initial longitude in decimal degrees */
  initialLng: number;

  /**
   * Lateral spacing between adjacent drones within a row, in meters.
   * This is the distance between neighboring drones in the same row.
   * Larger values spread each row wider.
   */
  lateralSpacing: number;

  /**
   * Longitudinal (depth) offset between successive rows in meters.
   * This is how far back each row sits behind the row ahead of it.
   * Larger values stretch the wedge longer behind the leader.
   */
  depthOffset: number;
}

/**
 * A formation member's offset from the leader in local coordinates (meters).
 *
 * These offsets are computed once when the formation is created and remain
 * fixed for the lifetime of the generator. On each tick, they are rotated
 * by the heading and added to the leader's current position to produce
 * absolute lat/lng for each drone.
 */
interface FormationOffset {
  droneId: string;
  callSign: string;
  x: number; // lateral offset in meters (negative = left, positive = right)
  y: number; // longitudinal offset in meters (negative = behind leader)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Meters per degree of latitude. This is approximately constant across
 * the earth (varies by ~0.5% from equator to poles). Sufficient for
 * the flat-earth approximation used here.
 */
const METERS_PER_DEGREE_LAT = 111_320;

// ---------------------------------------------------------------------------
// Formation geometry
// ---------------------------------------------------------------------------

/**
 * Generates formation offsets for a wedge (filled triangle) formation.
 *
 * The leader is at (0, 0) in row 1. Each subsequent row is centered
 * behind the leader and contains 2 more drones than the previous row.
 * Within each row, drones are evenly spaced and centered on the
 * leader's lateral axis (x = 0).
 *
 * Naming convention:
 *   - Row 1: droneId = "drone-0000", callSign = "R1-1" (the leader)
 *   - Row 2: droneId = "drone-0001" through "drone-0003",
 *            callSign = "R2-1", "R2-2", "R2-3" (left to right)
 *   - Row r: callSign = "Rr-1" through "Rr-(2r-1)"
 *
 * Geometry for 4 rows (16 drones), lateralSpacing = 50m, depthOffset = 30m:
 *
 *   Row 1 (y=0):               ●                          1 drone
 *                            (0, 0)
 *
 *   Row 2 (y=-30):        ●    ●    ●                     3 drones
 *                      (-50,0)(0,0)(50,0)
 *
 *   Row 3 (y=-60):     ●    ●    ●    ●    ●              5 drones
 *                  (-100) (-50) (0)  (50) (100)
 *
 *   Row 4 (y=-90):  ●    ●    ●    ●    ●    ●    ●      7 drones
 *               (-150)(-100)(-50) (0)  (50)(100)(150)
 *
 *   Total: 1 + 3 + 5 + 7 = 16 = 4²
 *
 * The number of rows is derived from droneCount: rows = floor(√droneCount).
 *
 * @param droneCount - Total number of drones. Should be a perfect square (r²).
 * @param lateralSpacing - Distance between adjacent drones in a row (meters)
 * @param depthOffset - Distance between successive rows (meters)
 * @returns Array of FormationOffset, one per drone, ordered row by row left to right
 */
export function generateFormation(
  droneCount: number,
  lateralSpacing: number,
  depthOffset: number,
): FormationOffset[] {
  const offsets: FormationOffset[] = [];

  // Derive the number of rows from drone count: rows = √droneCount
  const rows = Math.floor(Math.sqrt(droneCount));

  // Global drone index for generating sequential droneIds
  let droneIndex = 0;

  for (let row = 1; row <= rows; row++) {
    // Number of drones in this row: 1, 3, 5, 7, ... = (2·row - 1)
    const dronesInRow = 2 * row - 1;

    // This row sits behind the leader by (row - 1) × depthOffset.
    // Row 1 (leader row) is at y = 0, row 2 at y = -depthOffset, etc.
    const rowY = -(row - 1) * depthOffset;

    // The row is centered on x = 0. With `dronesInRow` drones spaced
    // by `lateralSpacing`, the leftmost drone is at:
    //   x = -((dronesInRow - 1) / 2) × lateralSpacing
    // and positions step rightward by lateralSpacing.
    const halfWidth = ((dronesInRow - 1) / 2) * lateralSpacing;

    for (let col = 0; col < dronesInRow; col++) {
      const x = -halfWidth + col * lateralSpacing;

      offsets.push({
        droneId: `drone-${String(droneIndex).padStart(4, '0')}`,
        callSign: `R${row}-${col + 1}`,
        x,
        y: rowY,
      });

      droneIndex++;
    }
  }

  return offsets;
}

// ---------------------------------------------------------------------------
// Coordinate math
// ---------------------------------------------------------------------------

/**
 * Converts a local (x, y) offset in meters to an absolute (lat, lng),
 * rotated to match the formation heading.
 *
 * The rotation maps the local coordinate system (where +y = forward along
 * heading, +x = right of heading) into geographic coordinates (where
 * +north = +lat, +east = +lng):
 *
 *   northMeters = y·cos(heading) - x·sin(heading)
 *   eastMeters  = y·sin(heading) + x·cos(heading)
 *
 * Verification for heading = 0° (north):
 *   northMeters = y·1 - x·0 = y  ✓ (forward = north)
 *   eastMeters  = y·0 + x·1 = x  ✓ (right = east)
 *
 * Verification for heading = 90° (east):
 *   northMeters = y·0 - x·1 = -x  ✓ (right of east = south = -north)
 *   eastMeters  = y·1 + x·0 = y   ✓ (forward along east = east)
 *
 * The meter-to-degree conversion uses a flat-earth approximation:
 *   - Latitude:  1° ≈ 111,320 m (constant)
 *   - Longitude: 1° ≈ 111,320 × cos(lat) m (shrinks toward poles)
 *
 * @param baseLat - Reference latitude (degrees)
 * @param baseLng - Reference longitude (degrees)
 * @param xMeters - Lateral offset (meters, positive = right of heading)
 * @param yMeters - Longitudinal offset (meters, positive = forward)
 * @param headingDeg - Compass heading (degrees, 0 = north)
 * @returns Absolute {lat, lng} in decimal degrees
 */
function offsetToLatLng(
  baseLat: number,
  baseLng: number,
  xMeters: number,
  yMeters: number,
  headingDeg: number,
): { lat: number; lng: number } {
  const headingRad = (headingDeg * Math.PI) / 180;

  // Rotate local offset into north/east components
  const northMeters =
    yMeters * Math.cos(headingRad) - xMeters * Math.sin(headingRad);
  const eastMeters =
    yMeters * Math.sin(headingRad) + xMeters * Math.cos(headingRad);

  // Convert meters to degrees (longitude degrees shrink with latitude)
  const metersPerDegreeLng =
    METERS_PER_DEGREE_LAT * Math.cos((baseLat * Math.PI) / 180);

  const lat = baseLat + northMeters / METERS_PER_DEGREE_LAT;
  const lng = baseLng + eastMeters / metersPerDegreeLng;

  return { lat, lng };
}

/**
 * Advances a position along a heading by a given distance.
 * Convenience wrapper around offsetToLatLng with x = 0 (no lateral offset).
 *
 * @param lat - Current latitude (degrees)
 * @param lng - Current longitude (degrees)
 * @param headingDeg - Direction of travel (degrees, 0 = north)
 * @param distanceMeters - Distance to advance (meters)
 * @returns New {lat, lng} after advancing
 */
function advancePosition(
  lat: number,
  lng: number,
  headingDeg: number,
  distanceMeters: number,
): { lat: number; lng: number } {
  return offsetToLatLng(lat, lng, 0, distanceMeters, headingDeg);
}

// ---------------------------------------------------------------------------
// Telemetry generator
// ---------------------------------------------------------------------------

export interface TelemetryGenerator {
  /**
   * Advance the formation by one time step and return updated drone states.
   *
   * Each call:
   *   1. Computes how far the formation moves: distance = speed × (dtMs / 1000)
   *   2. Advances the leader's lat/lng along the heading by that distance
   *   3. For each drone, applies its fixed formation offset (rotated by heading)
   *      to the leader's new position to get the drone's absolute lat/lng
   *   4. Returns a DroneState[] for every drone in the formation
   *
   * @param dtMs - Time delta in milliseconds since the last tick.
   *   This value MUST match the actual interval period so that the
   *   formation advances at the correct physical speed. Both the
   *   interval period and dtMs are derived from the same tickRateHz:
   *
   *     const periodMs = 1000 / tickRateHz;
   *     interval(periodMs).subscribe(() => generator.tick(periodMs));
   *
   *   Examples:
   *     - 10 Hz → interval(100) → tick(100) → formation moves speed × 0.1s per tick
   *     - 20 Hz → interval(50)  → tick(50)  → formation moves speed × 0.05s per tick
   *
   * @returns DroneState[] for every drone, with updated lat/lng/heading/lastUpdatedAt
   */
  tick: (dtMs: number) => DroneState[];

  /**
   * Reset the leader to its initial position.
   * The next tick() will start the formation from the beginning.
   * Typically called by DroneService.reset() before restarting playback.
   */
  reset: () => void;

  /**
   * Get the leader's current lat/lng.
   * Useful for map re-centering (though not part of the generator's scope).
   */
  getLeaderPosition: () => { lat: number; lng: number };
}

/**
 * Creates a telemetry generator for a wedge formation.
 *
 * The generator is stateful — it tracks the leader's current position
 * internally, advancing it on each tick(). Formation offsets are computed
 * once at creation time and reused on every tick (no per-tick allocation).
 *
 * This is pure computation with no side effects. It doesn't know about
 * RxJS, Zustand, or React. The caller (DroneServiceImpl) is responsible
 * for scheduling ticks and pushing results into the store.
 *
 * Usage:
 *   const generator = createTelemetryGenerator({
 *     droneCount: 225,         // 15² = 15 rows
 *     speed: 50,               // 50 m/s (~180 km/h)
 *     heading: 45,             // northeast
 *     initialLat: 37.77,
 *     initialLng: -122.42,
 *     lateralSpacing: 50,      // 50m between drones in a row
 *     depthOffset: 30,         // 30m between rows
 *   });
 *
 *   // Called by DroneServiceImpl's RxJS interval:
 *   const states = generator.tick(100); // 10 Hz → 100ms per tick
 *   droneStore.getState()._updateDrones(states);
 *
 * @param config - Formation parameters (drone count, speed, heading, spacing, etc.)
 * @returns TelemetryGenerator with tick/reset/getLeaderPosition methods
 */
export function createTelemetryGenerator(
  config: FormationConfig,
): TelemetryGenerator {
  const {
    droneCount,
    speed,
    heading,
    initialLat,
    initialLng,
    lateralSpacing,
    depthOffset,
  } = config;

  // Compute formation offsets once — these are fixed for the lifetime
  // of the generator. No per-tick allocation for formation geometry.
  const formation = generateFormation(droneCount, lateralSpacing, depthOffset);

  // Mutable leader position — the only state that changes on each tick.
  let leaderLat = initialLat;
  let leaderLng = initialLng;

  function tick(dtMs: number): DroneState[] {
    // Step 1: How far does the formation move this tick?
    const distanceMeters = speed * (dtMs / 1000);

    // Step 2: Advance the leader along the heading
    const newLeaderPos = advancePosition(
      leaderLat,
      leaderLng,
      heading,
      distanceMeters,
    );
    leaderLat = newLeaderPos.lat;
    leaderLng = newLeaderPos.lng;

    // Step 3: Compute each drone's absolute position from leader + rotated offset
    const now = Date.now();
    return formation.map((member) => {
      const pos = offsetToLatLng(
        leaderLat,
        leaderLng,
        member.x,
        member.y,
        heading,
      );
      return {
        droneId: member.droneId,
        callSign: member.callSign,
        lat: pos.lat,
        lng: pos.lng,
        heading,
        lastUpdatedAt: now,
      };
    });
  }

  function reset(): void {
    leaderLat = initialLat;
    leaderLng = initialLng;
  }

  function getLeaderPosition(): { lat: number; lng: number } {
    return { lat: leaderLat, lng: leaderLng };
  }

  return { tick, reset, getLeaderPosition };
}
