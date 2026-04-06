import { PerspectiveCamera, WebGLRenderer } from 'three';

/**
 * Keeps renderer size and perspective camera aspect in sync with the canvas element.
 * @returns Cleanup that disconnects the ResizeObserver.
 */
export function bindCanvasResize(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
): () => void {
  const resize = (): void => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) {
      return;
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  return () => {
    resizeObserver.disconnect();
  };
}
