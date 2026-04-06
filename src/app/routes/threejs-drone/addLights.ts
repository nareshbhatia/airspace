import { AmbientLight, DirectionalLight, PointLight, Scene } from 'three';

/**
 * Lighting for the Three.js drone demo.
 */
export function addLights(scene: Scene): void {
  scene.add(new AmbientLight(0xffffff, 0.4));
  const directional = new DirectionalLight(0xffffff, 6);
  directional.position.set(-500, 1000, 500);
  scene.add(directional);
  const point = new PointLight('orange', 10, 0, 0);
  point.position.set(300, 300, 300);
  scene.add(point);
}
