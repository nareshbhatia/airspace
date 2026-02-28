/**
 * Search radius options in miles for the traffic monitor bounding box.
 */
const RadiusMilesEnum = {
  Fifty: 50,
  Hundred: 100,
  ThreeHundred: 300,
} as const;

export { RadiusMilesEnum };

export const RADIUS_MILES_VALUES = [
  RadiusMilesEnum.Fifty,
  RadiusMilesEnum.Hundred,
  RadiusMilesEnum.ThreeHundred,
] as const;

export type RadiusMiles = (typeof RADIUS_MILES_VALUES)[number];
