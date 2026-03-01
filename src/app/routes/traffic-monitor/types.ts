/**
 * Search radius options in miles for the traffic monitor bounding box.
 */
export const RadiusMilesEnum = {
  Fifty: 50,
  Hundred: 100,
  ThreeHundred: 300,
} as const;

export const RADIUS_MILES_VALUES = [
  RadiusMilesEnum.Fifty,
  RadiusMilesEnum.Hundred,
  RadiusMilesEnum.ThreeHundred,
] as const;

export type RadiusMiles = (typeof RADIUS_MILES_VALUES)[number];

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
