import { PerspectiveCamera } from 'three';

/**
 * Perspective camera for the Three.js drone demo.
 */
export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(75, 1, 0.1, 5000);
  camera.position.set(0, 1000, 1000);
  return camera;
}
