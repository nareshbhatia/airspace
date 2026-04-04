/**
 * One vertex of a zone footprint. The ring is closed (first point may repeat
 * the last for GeoJSON-style rings).
 */
export interface AirspaceZoneFootprintPoint {
  lng: number;
  lat: number;
  /** Floor altitude at this vertex, meters above local ground (AGL). */
  floorMetersAgl: number;
}

export interface AirspaceZone {
  id: string;
  name: string;
  type: 'restricted' | 'advisory' | 'mission';
  color: string;
  opacity: number;
  /** Constant ceiling height above the floor at each footprint vertex (m). */
  ceilingHeightM: number;
  /**
   * Closed horizontal ring; 3D floor is defined by `floorMetersAgl` per point.
   * Mapbox `fill-extrusion` uses one base and one top per layer (see
   * `airspaceZoneFloorMinMetersAgl` / `airspaceZoneCeilingTopMaxMetersAgl`).
   */
  footprint: AirspaceZoneFootprintPoint[];
}

/**
 * Minimum floor AGL over the footprint of an airspace zone
 * Required for the extrusion base for Mapbox
 *
 * @param zone - The airspace zone.
 * @returns The minimum floor AGL over the footprint.
 */
export function airspaceZoneFloorMinMetersAgl(zone: AirspaceZone): number {
  return Math.min(...zone.footprint.map((p) => p.floorMetersAgl));
}

/**
 * Maximum ceiling AGL over the footprint of an airspace zone
 * Required for the extrusion top for Mapbox
 *
 * @param zone - The airspace zone.
 * @returns The maximum ceiling AGL over the footprint.
 */
export function airspaceZoneCeilingTopMaxMetersAgl(zone: AirspaceZone): number {
  return Math.max(
    ...zone.footprint.map((p) => p.floorMetersAgl + zone.ceilingHeightM),
  );
}
