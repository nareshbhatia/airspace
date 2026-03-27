import { MercatorCoordinate } from 'mapbox-gl';
import { Camera, Matrix4, Mesh, Scene, WebGLRenderer } from 'three';

import { computeModelTransform } from './mercatorUtils';

import type { Map as MapboxMap } from 'mapbox-gl';
import type { BufferGeometry, Material } from 'three';

export type ProjectionMode = 'perspective' | 'orthographic';

export type CameraSyncStrategy = 'mapbox-matrix' | 'near-clip-offset';

interface ThreeJsCustomLayerOptions {
  strategy?: CameraSyncStrategy;
  projectionMode?: ProjectionMode;
  maxOrthoContentHeightM?: number;
}

const EARTH_CIRCUMFERENCE_M = 40075016.68557849;

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

  /** Baked once: origin Mercator + meter scale does not change for this layer. */
  private readonly _modelTransform: Matrix4;

  private _projectionMode: ProjectionMode;

  private readonly _strategy: CameraSyncStrategy;

  private readonly _maxOrthoContentHeightM: number;

  constructor(
    scene: Scene,
    originMerc: MercatorCoordinate,
    options?: ThreeJsCustomLayerOptions,
  ) {
    this._scene = scene;
    this._modelTransform = computeModelTransform(originMerc);
    this._strategy = options?.strategy ?? 'mapbox-matrix';
    this._projectionMode = options?.projectionMode ?? 'perspective';
    this._maxOrthoContentHeightM = options?.maxOrthoContentHeightM ?? 100;
  }

  setProjectionMode(mode: ProjectionMode): void {
    this._projectionMode = mode;
  }

  /**
   * Initializes the Mapbox and Three.js components.
   * @param map - The Mapbox map.
   * @param gl - The WebGL2RenderingContext.
   */
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

  /**
   * Renders the Three.js scene using the Mapbox-driven projection matrix.
   * @param _gl - The WebGL2RenderingContext.
   * @param matrix - The frame matrix array.
   */
  render(_gl: WebGL2RenderingContext, matrix: number[]): void {
    // Skip rendering until map, camera, and renderer are initialized.
    if (!this._map || !this._camera || !this._renderer) return;

    // `matrix` is Mapbox's per-frame view-projection transform:
    // camera position/orientation + projection/frustum (including near/far clipping behavior).
    // Convert it from array form into a Three.js Matrix4.
    const m = new Matrix4().fromArray(matrix);

    // Apply our fixed geospatial model transform so local meter coordinates land
    // in the right map location, keeping Three.js aligned with Mapbox movement.
    this._camera.projectionMatrix = m.multiply(this._modelTransform);

    // Experimental mode: push Mapbox orthographic near clip behind the camera.
    if (this._strategy === 'near-clip-offset') {
      this.applyNearClipOffset();
    }

    // Reset GL state because Mapbox and Three.js share the same WebGL context.
    this._renderer.resetState();

    // Render the Three.js scene using the Mapbox-driven projection matrix.
    this._renderer.render(this._scene, this._camera);

    // Request another frame so the custom layer keeps updating.
    this._map.triggerRepaint();
  }

  private applyNearClipOffset(): void {
    const map = this._map as
      | (MapboxMap & { setNearClipOffset?: (offset: number) => MapboxMap })
      | undefined;
    const setNearClipOffset = map?.setNearClipOffset;
    if (!setNearClipOffset) return;

    if (this._projectionMode !== 'orthographic') {
      setNearClipOffset.call(map, 0);
      return;
    }

    const pixelsPerMeter = this.getPixelsPerMeter();
    const offset = -(this._maxOrthoContentHeightM * pixelsPerMeter);
    setNearClipOffset.call(map, offset);
  }

  private getPixelsPerMeter(): number {
    const mapAny = this._map as
      | (MapboxMap & {
          transform?: {
            tileSize?: number;
            scale?: number;
            center?: { lat?: number };
          };
        })
      | undefined;
    const transform = mapAny?.transform;
    const tileSize = transform?.tileSize;
    const scale = transform?.scale;
    const lat = transform?.center?.lat;
    if (
      tileSize === undefined ||
      scale === undefined ||
      lat === undefined ||
      Number.isNaN(lat)
    ) {
      return 1;
    }
    const worldSize = tileSize * scale;
    const metersPerMercatorUnitAtLat =
      EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180);
    const mercatorUnitsPerMeter = 1 / metersPerMercatorUnitAtLat;
    return mercatorUnitsPerMeter * worldSize;
  }

  /**
   * Cleans up the Three.js scene and releases resources.
   * @param _map - The Mapbox map.
   * @param _gl - The WebGL2RenderingContext.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(_map: MapboxMap, _gl: WebGL2RenderingContext): void {
    const map = this._map as
      | (MapboxMap & { setNearClipOffset?: (offset: number) => MapboxMap })
      | undefined;
    map?.setNearClipOffset?.(0);

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
