import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { Camera } from 'three';

export interface CreateOrbitControlsOptions {
  /** Smooth inertia on release of mouse button. */
  enableDamping?: boolean;

  /** How quickly the camera comes to a stop after releasing the mouse button. */
  dampingFactor?: number;
}

/**
 * Creates {@link OrbitControls} with optional damping (needed for smooth orbit when enabled).
 */
export function createOrbitControls(
  camera: Camera,
  domElement: HTMLElement,
  options?: CreateOrbitControlsOptions,
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  if (options?.enableDamping === true) {
    controls.enableDamping = true;
  }
  if (options?.dampingFactor !== undefined) {
    controls.dampingFactor = options.dampingFactor;
  }
  return controls;
}
