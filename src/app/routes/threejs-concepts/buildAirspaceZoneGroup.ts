import { MercatorCoordinate } from 'mapbox-gl';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  ShapeUtils,
  Vector2,
} from 'three';

import { mercatorToLocalPosition } from '../mapbox-plus-threejs/mercatorUtils';

import type { AirspaceZone } from '../../../lib/mapbox/types/AirspaceZone';

/**
 * Builds a closed volume per zone using per-vertex floorMetersAgl.
 */
export function buildAirspaceZoneGroup(
  zones: AirspaceZone[],
  centerLngLat: [number, number],
): Group {
  // 1) Anchor the whole scene near a local geographic origin.
  const originMerc = MercatorCoordinate.fromLngLat(centerLngLat, 0);
  const originScale = originMerc.meterInMercatorCoordinateUnits();
  const group = new Group();

  for (const zone of zones) {
    // 2) Normalize ring input and build one closed mesh per zone.
    const ring = dedupeClosingRing(zone.footprint);
    if (ring.length < 3) continue;
    const geometry = createZoneGeometry(zone, ring, originMerc, originScale);
    if (geometry === undefined) continue;

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
  originMerc: MercatorCoordinate,
  originScale: number,
): BufferGeometry | undefined {
  // 3) Convert each footprint point from [lng, lat] to local horizontal meters,
  // then map altitude to +Y: { x = east-ish, y = floorMetersAgl, z = north-ish }.
  const localVertices = ring.map((p) => {
    const local = mercatorToLocalPosition(
      [p.lng, p.lat],
      originMerc,
      originScale,
    );
    return { x: local.x, y: p.floorMetersAgl, z: local.y };
  });
  const shapePoints = localVertices.map((v) => new Vector2(v.x, v.z));
  // 4) Triangulate the horizontal footprint to create floor/ceiling faces.
  const triangles = ShapeUtils.triangulateShape(shapePoints, []);
  if (triangles.length === 0) return undefined;

  const n = localVertices.length;
  const positions: number[] = [];
  for (const v of localVertices) {
    positions.push(v.x, v.y, v.z);
  }
  for (const v of localVertices) {
    // Ceiling keeps the same per-vertex footprint, raised by zone ceiling height.
    positions.push(v.x, v.y + zone.ceilingHeightM, v.z);
  }

  const indices: number[] = [];
  for (const tri of triangles) {
    const [a, b, c] = tri;
    indices.push(a, b, c);
    indices.push(n + a, n + c, n + b);
  }

  for (let i = 0; i < n; i++) {
    // 5) Build wall quads (as two triangles) between floor and ceiling edges.
    const j = (i + 1) % n;
    indices.push(i, j, n + j);
    indices.push(i, n + j, n + i);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Disposes geometries and materials for meshes under this group.
 */
export function disposeAirspaceZoneGroup(group: Object3D): void {
  group.traverse((child) => {
    if (child instanceof Mesh) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
    }
  });
}
