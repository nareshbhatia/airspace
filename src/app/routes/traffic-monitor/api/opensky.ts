import type { Aircraft } from '../types';
import type { BoundingBox } from '../utils/boundingBox';

const OPEN_SKY_BASE = 'https://opensky-network.org/api/states/all';

/**
 * Raw state vector from OpenSky API (array by index).
 * Indices: 0=icao24, 1=callsign, 2=origin_country, 5=longitude, 6=latitude,
 * 7=baro_altitude (m), 9=velocity (m/s), 10=true_track (deg), 11=vertical_rate (m/s).
 */
type OpenSkyStateRow = (string | number | boolean | null)[];

export interface OpenSkyStatesResponse {
  time: number;
  states: OpenSkyStateRow[] | null;
}

const M_TO_FT = 3.28084;
const MS_TO_KTS = 1.94384;
const VERTICAL_RATE_THRESHOLD_MS = 2;

function getNum(row: OpenSkyStateRow, i: number): number | null {
  const v = row[i];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function getStr(row: OpenSkyStateRow, i: number): string | null {
  const v = row[i];
  return typeof v === 'string' ? v : null;
}

function phaseFromVerticalRate(
  verticalRateMs: number | null,
): Aircraft['phase'] {
  if (verticalRateMs === null) return 'Cruising';
  if (verticalRateMs > VERTICAL_RATE_THRESHOLD_MS) return 'Climbing';
  if (verticalRateMs < -VERTICAL_RATE_THRESHOLD_MS) return 'Descending';
  return 'Cruising';
}

/**
 * Fetches state vectors from OpenSky for the given bounding box.
 * Bounding box is [west, south, east, north].
 */
export async function fetchStateVectors(
  boundingBox: BoundingBox,
): Promise<OpenSkyStatesResponse> {
  const [west, south, east, north] = boundingBox;
  const url = new URL(OPEN_SKY_BASE);
  url.searchParams.set('lamin', String(south));
  url.searchParams.set('lomin', String(west));
  url.searchParams.set('lamax', String(north));
  url.searchParams.set('lomax', String(east));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`OpenSky API error: ${res.status}`);
  }
  return res.json() as Promise<OpenSkyStatesResponse>;
}

/**
 * Maps OpenSky state rows to Aircraft[], filtering out rows without valid
 * latitude/longitude and applying unit conversions.
 */
export function mapStateVectorsToAircraft(
  states: OpenSkyStateRow[] | null,
): Aircraft[] {
  if (!Array.isArray(states)) return [];

  const result: Aircraft[] = [];
  for (const row of states) {
    const lat = getNum(row, 6);
    const lng = getNum(row, 5);
    if (lat === null || lng === null) continue;

    const icao24 = getStr(row, 0) ?? '';
    if (!icao24) continue;

    const callsignRaw = getStr(row, 1)?.trim();
    const callsign =
      callsignRaw && callsignRaw.length > 0 ? callsignRaw : 'Unknown';
    const origin_country = getStr(row, 2) ?? '';
    const baroAltitudeM = getNum(row, 7);
    const velocityMs = getNum(row, 9);
    const trueTrack = getNum(row, 10);
    const verticalRate = getNum(row, 11);

    result.push({
      icao24,
      callsign,
      origin_country,
      latitude: lat,
      longitude: lng,
      altitudeFt: baroAltitudeM !== null ? baroAltitudeM * M_TO_FT : 0,
      velocityKts: velocityMs !== null ? velocityMs * MS_TO_KTS : 0,
      headingDeg: trueTrack !== null ? trueTrack : 0,
      verticalRateMs: verticalRate ?? 0,
      phase: phaseFromVerticalRate(verticalRate),
    });
  }
  return result;
}
