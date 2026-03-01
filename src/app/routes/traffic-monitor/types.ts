/**
 * Phase of flight derived from vertical rate (m/s).
 */
export type PhaseOfFlight = 'Climbing' | 'Cruising' | 'Descending';

/**
 * Normalized aircraft state from OpenSky, with display-ready units.
 */
export interface Aircraft {
  icao24: string;
  callsign: string;
  origin_country: string;
  latitude: number;
  longitude: number;
  altitudeFt: number;
  velocityKts: number;
  headingDeg: number;
  verticalRateMs: number;
  phase: PhaseOfFlight;
}
