import { PerspectiveCamera } from 'three';

/**
 * Perspective camera for the Three.js concepts (zones) viewport.
 */
export function createCamera(): PerspectiveCamera {
  return new PerspectiveCamera(55, 1, 0.1, 500_000);
}
