import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';

import type { FrameCallback } from '../../../lib/threejs';
import type { Material } from 'three';

const bodyMaterial = new MeshStandardMaterial({
  color: 0x282828,
  metalness: 0.7,
  roughness: 0.3,
});

const rotorMaterial = new MeshStandardMaterial({
  color: 0x2196f3,
  metalness: 0.7,
  roughness: 0.5,
});

/**
 * Drone model: two plates, four rotors, and four arms (imperative Three.js).
 */
export function buildDroneGroup(): Group {
  const group = new Group();

  const plate1 = new Mesh(new BoxGeometry(200, 10, 200), bodyMaterial);
  plate1.position.set(0, 15, 0);
  group.add(plate1);

  const plate2 = new Mesh(new BoxGeometry(200, 10, 200), bodyMaterial);
  plate2.position.set(0, -15, 0);
  group.add(plate2);

  const rotorPositions: [number, number, number][] = [
    [-275, 20, -275],
    [275, 20, -275],
    [-275, 20, 275],
    [275, 20, 275],
  ];
  for (const [x, y, z] of rotorPositions) {
    const rotor = new Mesh(new CylinderGeometry(75, 75, 20), rotorMaterial);
    rotor.position.set(x, y, z);
    group.add(rotor);
  }

  const armSpecs: Array<{
    pos: [number, number, number];
    rot: [number, number, number];
  }> = [
    { pos: [-175, 0, -175], rot: [Math.PI / 2, 0, -Math.PI / 4] },
    { pos: [175, 0, -175], rot: [Math.PI / 2, 0, Math.PI / 4] },
    { pos: [175, 0, 175], rot: [Math.PI / 2, 0, -Math.PI / 4] },
    { pos: [-175, 0, 175], rot: [Math.PI / 2, 0, Math.PI / 4] },
  ];
  for (const { pos, rot } of armSpecs) {
    const arm = new Mesh(new CylinderGeometry(10, 10, 290), bodyMaterial);
    arm.position.set(pos[0], pos[1], pos[2]);
    arm.rotation.set(rot[0], rot[1], rot[2]);
    group.add(arm);
  }

  return group;
}

/**
 * Hover oscillation and slow yaw, matching the former R3F `useFrame` behavior.
 */
export function createDroneFrameCallback(drone: Group): FrameCallback {
  return (elapsed: number, delta: number) => {
    drone.position.y = Math.sin(elapsed * 1.5) * 20;
    drone.rotation.y += delta * 0.3;
  };
}

/**
 * Disposes geometries and shared materials for meshes under the drone group.
 */
export function disposeDroneGroup(drone: Group): void {
  const materials = new Set<Material>();
  drone.traverse((child) => {
    if (child instanceof Mesh) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => materials.add(m));
      } else {
        materials.add(mat);
      }
    }
  });
  materials.forEach((m) => m.dispose());
}
