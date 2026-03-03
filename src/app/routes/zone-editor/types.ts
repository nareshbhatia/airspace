/**
 * Zone type for drawn polygons. Drives color and label in the UI.
 */
export type ZoneType =
  | 'mission-boundary'
  | 'no-fly-zone'
  | 'restricted-airspace';

/**
 * Committed zone: a polygon drawn by the user with type and derived properties.
 */
export interface DrawnZone {
  id: string;
  type: ZoneType | null;
  geometry: GeoJSON.Polygon;
  areaSqKm: number;
  vertexCount: number;
  createdAt: Date;
}
