import { WebGLRenderer } from 'three';

import type { WebGLRendererParameters } from 'three';

/**
 * Binds Three.js to an existing canvas (declarative HTML/JSX) with a capped device pixel ratio.
 */
export function createWebGLRenderer(
  canvas: HTMLCanvasElement,
  parameters?: WebGLRendererParameters,
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    ...parameters,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return renderer;
}
