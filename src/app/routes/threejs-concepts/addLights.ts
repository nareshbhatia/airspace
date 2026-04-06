import { AmbientLight, DirectionalLight, Scene } from 'three';

/**
 * Lighting for the airspace zones Three.js concepts viewport.
 */
export function addLights(scene: Scene): void {
  scene.add(new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xffffff, 1.05);
  sun.position.set(220, 420, 180);
  scene.add(sun);
}
