import { MercatorCoordinate } from 'mapbox-gl';
import { Camera, Matrix4, Mesh, Scene, WebGLRenderer } from 'three';

import { computeModelTransform } from './mercatorUtils';

import type { Map as MapboxMap } from 'mapbox-gl';
import type { BufferGeometry, Material } from 'three';

/**
 * Mapbox custom layer that renders a pre-built Three.js scene in the map's WebGL
 * pipeline.
 *
 * Follows the Mapbox "add-3d-model" example pattern: bake a model transform
 * (translation to MercatorCoordinate + meter-to-Mercator scale + axis flip)
 * into the camera's projectionMatrix each frame using Mapbox's `matrix` from
 * `render(gl, matrix)`.
 */
export class ThreeJsCustomLayer {
  readonly id = 'threejs-layer';

  readonly type = 'custom' as const;

  readonly renderingMode = '3d' as const;

  private _map: MapboxMap | undefined;

  private _camera: Camera | undefined;

  private _renderer: WebGLRenderer | undefined;

  private readonly _scene: Scene;

  private readonly _originMerc: MercatorCoordinate;

  constructor(scene: Scene, originMerc: MercatorCoordinate) {
    this._scene = scene;
    this._originMerc = originMerc;
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

    const modelTransform = computeModelTransform(this._originMerc);
    const m = new Matrix4().fromArray(matrix);
    this._camera.projectionMatrix = m.multiply(modelTransform);

    this._renderer.resetState();
    this._renderer.render(this._scene, this._camera);
    this._map.triggerRepaint();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(_map: MapboxMap, _gl: WebGL2RenderingContext): void {
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
