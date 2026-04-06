import { useLayoutEffect, useRef } from 'react';

import { addLights } from './addLights';
import {
  buildDroneGroup,
  createDroneFrameCallback,
  disposeDroneGroup,
} from './buildDroneGroup';
import { createCamera } from './createCamera';
import {
  bindCanvasResize,
  createOrbitControls,
  createScene,
  createWebGLRenderer,
  startRenderLoop,
} from '../../../lib/threejs';
import { cn } from '../../../utils/cn';

import type { RenderLoopHandle } from '../../../lib/threejs';

/**
 * Renders a 3D drone using raw Three.js.
 * Scene construction sequence:
 *   1. Scene
 *   2. Camera
 *   3. Lights (ambient, directional, point)
 *   4. One or more meshes (geometry + material)
 *   5. A renderer
 *   6. Controls to interact with the scene, e.g. orbit controls (optional)
 */
export function ThreejsDronePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    /** ---------- Scene ---------- */
    const scene = createScene();

    /** ---------- Camera ---------- */
    const camera = createCamera();

    /** ---------- Lights ---------- */
    addLights(scene);

    /** ---------- Meshes ---------- */
    const drone = buildDroneGroup();
    scene.add(drone);

    /** ---------- Renderer ---------- */
    const renderer = createWebGLRenderer(canvas);
    const unbindResize = bindCanvasResize(canvas, camera, renderer);
    const controls = createOrbitControls(camera, canvas, {
      enableDamping: true,
    });

    /** ---------- Render Loop ---------- */
    const frameCallbacks = [createDroneFrameCallback(drone)];
    const renderLoop: RenderLoopHandle = startRenderLoop({
      scene,
      camera,
      renderer,
      controls,
      frameCallbacks,
    });

    /** ---------- Cleanup ---------- */
    return () => {
      renderLoop.stop();
      unbindResize();
      controls.dispose();
      scene.remove(drone);
      disposeDroneGroup(drone);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn('block h-full min-h-0 w-full flex-1')}
      />
    </div>
  );
}
