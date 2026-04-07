import { MercatorCoordinate } from 'mapbox-gl';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  ShapeUtils,
  Vector2,
} from 'three';

import { mercatorToLocalPosition } from '../../../lib/mapbox/utils/mercatorUtils';

import type { AirspaceZone } from '../../../lib/mapbox/types/AirspaceZone';

/**
 * Builds zone geometry directly in the Mapbox custom-layer local coordinate system:
 * - `x` = east-west meters
 * - `y` = north-south meters
 * - `z` = altitude meters
 *
 * This avoids the root-group rotation/flip bridge that was previously needed
 * when reusing the standalone Three.js concepts builders.
 */
export function buildMapboxAirspaceZoneGroup(
  zones: AirspaceZone[],
  centerLngLat: [number, number],
  getTerrainElevationMeters?: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters = 0,
): Group {
  const originMercator = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMercator.meterInMercatorCoordinateUnits();
  const group = new Group();

  for (const zone of zones) {
    const ring = dedupeClosingRing(zone.footprint);
    if (ring.length < 3) continue;

    const geometry = createZoneGeometry(
      zone,
      ring,
      originMercator,
      originScale,
      getTerrainElevationMeters,
      centerTerrainElevationMeters,
    );
    if (!geometry) continue;

    const material = new MeshStandardMaterial({
      color: new Color(zone.color),
      transparent: true,
      opacity: zone.opacity,
      side: DoubleSide,
      metalness: 0.05,
      roughness: 0.85,
    });

    const mesh = new Mesh(geometry, material);
    mesh.name = zone.id;
    group.add(mesh);
  }

  return group;
}

function dedupeClosingRing(
  footprint: AirspaceZone['footprint'],
): AirspaceZone['footprint'] {
  if (footprint.length < 2) return footprint;
  const first = footprint[0]!;
  const last = footprint[footprint.length - 1]!;
  if (first.lng === last.lng && first.lat === last.lat) {
    return footprint.slice(0, -1);
  }
  return footprint;
}

function createZoneGeometry(
  zone: AirspaceZone,
  ring: AirspaceZone['footprint'],
  originMercator: MercatorCoordinate,
  originScale: number,
  getTerrainElevationMeters?: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters = 0,
): BufferGeometry | undefined {
  /**
   * Build local vertices directly as:
   * - `x` = east-west meters
   * - `y` = north-south meters
   * - `z` = altitude meters
   *
   * Known limitation:
   * We currently sample terrain only at the zone footprint vertices, then
   * triangulate a floor across the polygon interior. In mountainous terrain,
   * the interior terrain can rise above that interpolated floor, so the Three.js
   * zone can become partially or fully occluded even when the Mapbox-native
   * extrusion still appears to wrap the mountain correctly.
   *
   * Proper fix:
   * Replace this boundary-only prism with a terrain-conforming mesh:
   *   1. tessellate the polygon interior into many smaller triangles
   *   2. sample terrain for interior vertices as well as boundary vertices
   *   3. build the floor from that denser terrain-aware mesh
   *   4. extrude the ceiling/walls from the terrain-conforming floor
   */
  const localVertices = ring.map((point) => {
    const local = mercatorToLocalPosition(
      [point.lng, point.lat],
      originMercator,
      originScale,
    );
    const terrainElevationMeters =
      getTerrainElevationMeters?.([point.lng, point.lat]) ?? 0;
    const terrainDeltaMeters =
      terrainElevationMeters - centerTerrainElevationMeters;
    return {
      x: local.x,
      y: local.y,
      z: terrainDeltaMeters + point.floorMetersAgl,
    };
  });

  const shapePoints = localVertices.map(
    (vertex) => new Vector2(vertex.x, vertex.y),
  );
  const triangles = ShapeUtils.triangulateShape(shapePoints, []);
  if (triangles.length === 0) return undefined;

  const vertexCount = localVertices.length;
  const positions: number[] = [];

  for (const vertex of localVertices) {
    positions.push(vertex.x, vertex.y, vertex.z);
  }
  for (const vertex of localVertices) {
    positions.push(vertex.x, vertex.y, vertex.z + zone.ceilingHeightM);
  }

  const indices: number[] = [];
  for (const triangle of triangles) {
    const [a, b, c] = triangle;
    indices.push(a, b, c);
    indices.push(vertexCount + a, vertexCount + c, vertexCount + b);
  }

  for (let i = 0; i < vertexCount; i++) {
    const j = (i + 1) % vertexCount;
    indices.push(i, j, vertexCount + j);
    indices.push(i, vertexCount + j, vertexCount + i);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
