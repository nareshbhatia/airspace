/**
 * Generates telemetry.json for Flightpath: 3 drones (alpha, bravo, charlie),
 * 30s at 10 Hz (300 frames per drone, 900 total), chronologically interleaved,
 * curved paths near Boston Logan Airport.
 *
 * Run: node scripts/generate-telemetry.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = new URL('../src/gen/telemetry.json', import.meta.url);
const outputDir = dirname(fileURLToPath(OUTPUT_PATH));

// Boston Logan Airport vicinity (WGS84)
const LOGAN_LAT = 42.363;
const LOGAN_LNG = -71.0062;

const DURATION_MS = 30_000;
const INTERVAL_MS = 100;
const FRAMES_PER_DRONE = DURATION_MS / INTERVAL_MS; // 300

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Curved path: circular orbit around a center. Heading = direction of travel.
 */
function circlePath(centerLat, centerLng, radiusDeg, tSec, phaseRad = 0) {
  const angle = (2 * Math.PI * tSec) / 30 + phaseRad;
  const lat = centerLat + radiusDeg * Math.cos(angle);
  const lng = centerLng + radiusDeg * Math.sin(angle);
  const heading = toDeg(angle) + 90; // direction of travel (east = 90)
  return { lat, lng, heading: ((heading % 360) + 360) % 360 };
}

/**
 * Curved path: elliptical loop. Heading = direction of travel.
 */
function ellipsePath(centerLat, centerLng, aDeg, bDeg, tSec, phaseRad = 0) {
  const angle = (2 * Math.PI * tSec) / 30 + phaseRad;
  const lat = centerLat + aDeg * Math.cos(angle);
  const lng = centerLng + bDeg * Math.sin(angle);
  const dlat = -aDeg * Math.sin(angle);
  const dlng = bDeg * Math.cos(angle);
  const heading = toDeg(Math.atan2(dlng, dlat));
  return { lat, lng, heading: ((heading % 360) + 360) % 360 };
}

/**
 * Curved path: gentle arc (approach-style). Heading follows path.
 */
function arcPath(
  centerLat,
  centerLng,
  radiusDeg,
  tSec,
  startAngleRad,
  arcSpanRad,
) {
  const angle = startAngleRad + (arcSpanRad * tSec) / 30;
  const lat = centerLat + radiusDeg * Math.cos(angle);
  const lng = centerLng + radiusDeg * Math.sin(angle);
  const heading = toDeg(angle) + 90;
  return { lat, lng, heading: ((heading % 360) + 360) % 360 };
}

function generateFrames() {
  const frames = [];

  for (let i = 0; i < FRAMES_PER_DRONE; i++) {
    const timestamp = i * INTERVAL_MS;
    const tSec = timestamp / 1000;

    // Alpha: clockwise circle north of Logan
    const a = circlePath(LOGAN_LAT + 0.003, LOGAN_LNG, 0.004, tSec, 0);
    frames.push({
      droneId: 'alpha',
      timestamp,
      lat: a.lat,
      lng: a.lng,
      heading: Math.round(a.heading * 10) / 10,
    });

    // Bravo: ellipse east of Logan
    const b = ellipsePath(
      LOGAN_LAT,
      LOGAN_LNG + 0.004,
      0.0025,
      0.004,
      tSec,
      Math.PI / 4,
    );
    frames.push({
      droneId: 'bravo',
      timestamp,
      lat: b.lat,
      lng: b.lng,
      heading: Math.round(b.heading * 10) / 10,
    });

    // Charlie: arc (approach-style) south of Logan
    const c = arcPath(
      LOGAN_LAT - 0.002,
      LOGAN_LNG,
      0.005,
      tSec,
      Math.PI * 0.3,
      Math.PI * 0.6,
    );
    frames.push({
      droneId: 'charlie',
      timestamp,
      lat: c.lat,
      lng: c.lng,
      heading: Math.round(c.heading * 10) / 10,
    });
  }

  return frames;
}

function main() {
  const frames = generateFrames();
  const json = JSON.stringify(frames, null, 0);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, json + '\n', 'utf8');

  console.log(`Wrote ${frames.length} frames to ${fileURLToPath(OUTPUT_PATH)}`);
  const byDrone = { alpha: 0, bravo: 0, charlie: 0 };
  frames.forEach((f) => byDrone[f.droneId]++);
  console.log('Per drone:', byDrone);
}

main();
