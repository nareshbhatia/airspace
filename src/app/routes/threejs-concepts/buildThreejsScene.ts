import { Box3, Group, Line, Material, Mesh, Sphere } from 'three';

import { addLights } from './addLights';
import { buildAirspaceZoneGroup } from './buildAirspaceZoneGroup';
import { buildPoleGroup } from './buildPoleGroup';
import { buildRouteLine } from './buildRouteLine';
import { createCamera } from './createCamera';
import {
  bindCanvasResize,
  createOrbitControls,
  createScene,
  createWebGLRenderer,
  startRenderLoop,
} from '../../../lib/threejs';

import type { AirspaceZone } from '../../../lib/mapbox/types/AirspaceZone';
import type { Pole } from '../../../lib/mapbox/types/Pole';
import type { Waypoint } from '../../../lib/mapbox/types/Waypoint';
import type { RenderLoopHandle } from '../../../lib/threejs';
import type { LngLatLike } from 'mapbox-gl';
import type { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ThreejsSceneApi {
  setSceneAndCenter: (
    zones: AirspaceZone[],
    poles: Pole[],
    route: Waypoint[],
    center: [number, number],
  ) => void;
  dispose: () => void;
}

/**
 * Builds a Three.js scene for the page.
 * Scene construction sequence:
 *   1. Scene
 *   2. Camera
 *   3. Lights (ambient, directional, point)
 *   4. One or more meshes (geometry + material)
 *   5. A renderer
 *   6. Controls to interact with the scene, e.g. orbit controls (optional)
 */
export function buildThreejsScene(canvas: HTMLCanvasElement): ThreejsSceneApi {
  /** ---------- Scene ---------- */
  const scene = createScene({ grid: true, axes: true });

  /** ---------- Camera ---------- */
  const camera = createCamera();

  /** ---------- Lights ---------- */
  addLights(scene);

  /** ---------- Meshes ---------- */
  let contentGroup: Group | undefined;

  const setSceneAndCenter = (
    zones: AirspaceZone[],
    poles: Pole[],
    route: Waypoint[],
    center: [number, number],
  ): void => {
    if (contentGroup) {
      scene.remove(contentGroup);
      disposeSceneContentGroup(contentGroup);
      contentGroup = undefined;
    }
    const nextContentGroup = new Group();
    const zoneGroup = buildAirspaceZoneGroup(zones, center);
    nextContentGroup.add(zoneGroup);
    const poleGroup = buildPoleGroup(poles, center);
    if (poleGroup) nextContentGroup.add(poleGroup);
    const routeLine = buildRouteLine(route, center);
    if (routeLine) nextContentGroup.add(routeLine);
    contentGroup = nextContentGroup;
    scene.add(contentGroup);
    fitCameraToGroup(camera, controls, contentGroup);
  };

  /** ---------- Renderer ---------- */
  const renderer = createWebGLRenderer(canvas);
  const unbindResize = bindCanvasResize(canvas, camera, renderer);
  const controls = createOrbitControls(camera, canvas, {
    enableDamping: true,
    dampingFactor: 0.06,
  });

  /** ---------- Render Loop ---------- */
  const renderLoop: RenderLoopHandle = startRenderLoop({
    scene,
    camera,
    renderer,
    controls,
  });

  /** ---------- Cleanup ---------- */
  const dispose = (): void => {
    renderLoop.stop();
    unbindResize();
    controls.dispose();
    if (contentGroup) {
      scene.remove(contentGroup);
      disposeSceneContentGroup(contentGroup);
    }
    renderer.dispose();
  };

  return { setSceneAndCenter, dispose };
}

export function lngLatLikeToTuple(center: LngLatLike): [number, number] {
  if (Array.isArray(center)) {
    return [Number(center[0]), Number(center[1])];
  }
  if ('lng' in center) {
    return [center.lng, center.lat];
  }
  return [center.lon, center.lat];
}

function fitCameraToGroup(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  object: Group,
): void {
  const box = new Box3().setFromObject(object);
  if (box.isEmpty()) {
    camera.position.set(400, 280, 400);
    camera.near = 0.1;
    camera.far = 200_000;
    camera.updateProjectionMatrix();
    controls.target.set(0, 40, 0);
    controls.update();
    return;
  }

  const sphere = box.getBoundingSphere(new Sphere());
  const c = sphere.center;
  const r = Math.max(sphere.radius, 12);
  const dist = r * 2.85;

  camera.position.set(c.x + dist * 0.72, c.y + dist * 0.48, c.z + dist * 0.72);
  camera.near = Math.max(0.1, dist / 2500);
  camera.far = Math.max(80_000, dist * 60);
  camera.updateProjectionMatrix();

  controls.target.copy(c);
  controls.update();
}

function disposeSceneContentGroup(group: Group): void {
  group.traverse((child) => {
    if (child instanceof Mesh || child instanceof Line) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat) => mat.dispose());
      } else {
        (material as Material).dispose();
      }
    }
  });
}
