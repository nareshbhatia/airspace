import { MercatorCoordinate } from 'mapbox-gl';
import { Camera, Matrix4, Mesh, Scene, WebGLRenderer } from 'three';

import { computeModelTransform, getPixelsPerMeter } from './mercatorUtils';

import type {
  ProjectionMode,
  ThreeJsMapCustomLayer,
} from './threeJsMapLayerTypes';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { BufferGeometry, Material } from 'three';

interface ThreeJsCameraSyncCustomLayerOptions {
  projectionMode?: ProjectionMode;
  maxOrthoContentHeightM?: number;
}

/**
 * UI strategy **camera-sync** (CS): same Three.js **projection** as
 * {@link ThreeJsCustomLayer} — `projectionMatrix = matrix × modelTransform` from
 * `render(gl, matrix)` plus `computeModelTransform(originMerc)`. Does **not** use
 * Threebox-style manual camera/world matrices.
 *
 * Additionally, in **orthographic** projection only, calls Mapbox’s experimental
 * `map.setNearClipOffset` (offset from `maxOrthoContentHeightM` and
 * {@link getPixelsPerMeter}) so the map’s near plane is less aggressive on tall
 * content; perspective mode resets the offset to `0`. See Mapbox GL JS JSDoc on
 * `setNearClipOffset`.
 *
 * The {@link CameraSync} module in this folder is a Threebox reference port only;
 * it is not imported or used by this class.
 */
export class ThreeJsCameraSyncCustomLayer implements ThreeJsMapCustomLayer {
  readonly id = 'threejs-layer';

  readonly type = 'custom' as const;

  readonly renderingMode = '3d' as const;

  private _map: MapboxMap | undefined;

  private _camera: Camera | undefined;

  private _renderer: WebGLRenderer | undefined;

  private readonly _scene: Scene;

  private readonly _modelTransform: Matrix4;

  private _projectionMode: ProjectionMode;

  private readonly _maxOrthoContentHeightM: number;

  constructor(
    scene: Scene,
    originMerc: MercatorCoordinate,
    options?: ThreeJsCameraSyncCustomLayerOptions,
  ) {
    this._scene = scene;
    this._modelTransform = computeModelTransform(originMerc);
    this._projectionMode = options?.projectionMode ?? 'perspective';
    this._maxOrthoContentHeightM = options?.maxOrthoContentHeightM ?? 1000;
  }

  setProjectionMode(mode: ProjectionMode): void {
    this._projectionMode = mode;
  }

  onAdd(map: MapboxMap, gl: WebGL2RenderingContext): void {
    this._map = map;
    const renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    renderer.autoClear = false;

    this._camera = new Camera();
    this._renderer = renderer;
  }

  render(_gl: WebGL2RenderingContext, matrix: number[]): void {
    if (!this._map || !this._camera || !this._renderer) return;

    const m = new Matrix4().fromArray(matrix);
    this._camera.projectionMatrix = m.multiply(this._modelTransform);

    this.applyNearClipOffset();

    this._renderer.resetState();
    this._renderer.render(this._scene, this._camera);
    this._map.triggerRepaint();
  }

  private applyNearClipOffset(): void {
    const map = this._map;
    if (!map) return;

    if (this._projectionMode !== 'orthographic') {
      map.setNearClipOffset(0);
      return;
    }

    const pixelsPerMeter = getPixelsPerMeter(map);
    const offset = -(this._maxOrthoContentHeightM * pixelsPerMeter);
    map.setNearClipOffset(offset);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(_map: MapboxMap, _gl: WebGL2RenderingContext): void {
    this._map?.setNearClipOffset(0);

    this._scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        (obj.geometry as BufferGeometry).dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          (obj.material as Material).dispose();
        }
      }
    });

    this._renderer?.dispose();
    this._map = undefined;
    this._camera = undefined;
    this._renderer = undefined;
  }
}
