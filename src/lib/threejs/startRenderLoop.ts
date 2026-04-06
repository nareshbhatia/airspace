import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { FrameCallback } from './types';

export interface StartRenderLoopOptions {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  /**
   * When omitted or empty, each frame only runs `controls.update()` and `render`.
   * When non-empty, each callback receives clock elapsed time and delta before
   * controls/render.
   */
  frameCallbacks?: FrameCallback[];
}

export interface RenderLoopHandle {
  stop: () => void;
}

/**
 * requestAnimationFrame loop for OrbitControls + WebGLRenderer.
 * Supports optional per-frame updatables for animation.
 */
export function startRenderLoop(
  options: StartRenderLoopOptions,
): RenderLoopHandle {
  const {
    scene,
    camera,
    renderer,
    controls,
    frameCallbacks: updatables,
  } = options;
  const hasUpdatables = updatables != null && updatables.length > 0;
  const clock = hasUpdatables ? new Clock() : undefined;
  let rafId = 0;

  const tick = (): void => {
    rafId = requestAnimationFrame(tick);
    if (clock != null && updatables != null) {
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();
      for (const fn of updatables) {
        fn(elapsed, delta);
      }
    }
    controls.update();
    renderer.render(scene, camera);
  };

  tick();

  return {
    stop: () => {
      cancelAnimationFrame(rafId);
    },
  };
}
