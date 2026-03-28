/**
 * Ported from ThreeBox / internal PR: syncs Three.js camera and projection with
 * Mapbox's transform using manual matrices (not Mapbox's custom-layer `matrix`).
 *
 * Reference only in this repo: pole meshes use meter space under
 * `computeModelTransform`; the active **camera-sync** custom layer uses the same
 * `projectionMatrix = matrix × modelTransform` path as mapbox-matrix plus
 * `setNearClipOffset` in orthographic mode, so content stays in clip space with
 * Mapbox. Revisit wiring this class when a manual-matrix pipeline matches that
 * scene graph.
 *
 * @see https://github.com/jscastro76/threebox/blob/2cdbd1f17865eef86c6cdeb0d4677029aac5b3d6/src/camera/CameraSync.js
 */

import { MathUtils, Matrix4, PerspectiveCamera, Group } from 'three';

import type { Map as MapboxMap } from 'mapbox-gl';

const WORLD_SIZE = 1024000; // TILE_SIZE * 2000
const FOV = Math.atan(3 / 4);
const EARTH_RADIUS = 6371008.8;

export const ThreeboxConstants = {
  WORLD_SIZE,
  EARTH_CIRCUMFERENCE: 2 * Math.PI * EARTH_RADIUS,
  FOV,
  FOV_DEGREES: (FOV * 180) / Math.PI,
  TILE_SIZE: 512,
} as const;

/** High orthographic camera altitude in world units; zoom changes frustum, not Z. */
export const ORTHOGRAPHIC_FIXED_ALTITUDE = 1e7;

function makePerspectiveMatrix(
  fovy: number,
  aspect: number,
  near: number,
  far: number,
): Matrix4 {
  const out = new Matrix4();
  const f = 1.0 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);

  const newMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ] = [
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ];

  out.elements = newMatrix;
  return out;
}

function makeOrthographicMatrix(
  left: number,
  right: number,
  top: number,
  bottom: number,
  near: number,
  far: number,
): Matrix4 {
  const out = new Matrix4();
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  const newMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ] = [
    -2 * lr,
    0,
    0,
    0,
    0,
    -2 * bt,
    0,
    0,
    0,
    0,
    2 * nf,
    0,
    (left + right) * lr,
    (top + bottom) * bt,
    (far + near) * nf,
    1,
  ];

  out.elements = newMatrix;
  return out;
}

export class CameraSync {
  private readonly map: MapboxMap;

  private _camera: PerspectiveCamera;

  readonly world: Group;

  private cameraTranslateZ = new Matrix4();

  private halfFov = 0;

  private cameraToCenterDistance = 0;

  private translateCenter: Matrix4;

  private readonly _worldSizeRatio: number;

  private _isOrthographic = false;

  private readonly __tempMatrix4 = new Matrix4();

  private readonly __tempScaleMat = new Matrix4();

  private readonly __tempRotateMat = new Matrix4();

  private readonly __tempTranslateMat = new Matrix4();

  private readonly _maxOrthoContentHeightM: number;

  constructor(
    map: MapboxMap,
    camera: PerspectiveCamera,
    world?: Group,
    maxOrthoContentHeightM?: number,
  ) {
    this.map = map;
    this._camera = camera;
    this._maxOrthoContentHeightM = maxOrthoContentHeightM ?? 1000;

    this._camera.matrixAutoUpdate = false;

    this.world = world ?? new Group();
    this.world.position.set(
      ThreeboxConstants.WORLD_SIZE / 2,
      ThreeboxConstants.WORLD_SIZE / 2,
      0,
    );
    this.world.matrixAutoUpdate = false;

    this.translateCenter = new Matrix4().makeTranslation(
      ThreeboxConstants.WORLD_SIZE / 2,
      -ThreeboxConstants.WORLD_SIZE / 2,
      0,
    );
    this._worldSizeRatio =
      ThreeboxConstants.TILE_SIZE / ThreeboxConstants.WORLD_SIZE;
  }

  update(): void {
    const t = this.map.transform;
    const offset = t.centerOffset;
    const worldSize = this.worldSize();

    const isOrthographic = this._isOrthographic;

    this.halfFov = t._fov / 2;
    const groundAngle = Math.PI / 2 + t._pitch;
    const pitchAngle = Math.cos(Math.PI / 2 - t._pitch);

    this.cameraToCenterDistance = (0.5 / Math.tan(this.halfFov)) * t.height;

    const pixelsPerMeter =
      this.mercatorZfromAltitude(1, t.center.lat) * worldSize;
    const fovAboveCenter = t._fov * (0.5 + t.centerOffset.y / t.height);

    const minElevationInPixels = t.elevation
      ? t.elevation.getMinElevationBelowMSL() * pixelsPerMeter
      : 0;
    const cameraToSeaLevelDistance =
      (t._camera.position[2] * worldSize - minElevationInPixels) /
      Math.cos(t._pitch);
    const topHalfSurfaceDistance =
      (Math.sin(fovAboveCenter) * cameraToSeaLevelDistance) /
      Math.sin(
        MathUtils.clamp(
          Math.PI - groundAngle - fovAboveCenter,
          0.01,
          Math.PI - 0.01,
        ),
      );

    const furthestDistance =
      pitchAngle * topHalfSurfaceDistance + cameraToSeaLevelDistance;
    const horizonDistance =
      cameraToSeaLevelDistance *
      (1 / (t._horizonShift !== 0 ? t._horizonShift : 1));

    const h = t.height;
    const w = t.width;

    const cameraAltitude = isOrthographic
      ? ORTHOGRAPHIC_FIXED_ALTITUDE
      : this.cameraToCenterDistance;

    let nearZ: number;
    let farZ: number;
    if (isOrthographic) {
      nearZ = 1;
      farZ = ORTHOGRAPHIC_FIXED_ALTITUDE * 2;

      this.map.setNearClipOffset(
        -(this._maxOrthoContentHeightM * pixelsPerMeter),
      );
    } else {
      farZ = Math.min(furthestDistance * 1.01, horizonDistance);
      const nz = t.height / 50;
      nearZ = Math.max(nz * pitchAngle, nz);

      this.map.setNearClipOffset(0);
    }

    this.cameraTranslateZ.makeTranslation(0, 0, cameraAltitude);

    if (isOrthographic) {
      const halfHeight = this.cameraToCenterDistance * Math.tan(this.halfFov);
      const halfWidth = halfHeight * (w / h);

      this._camera.projectionMatrix = makeOrthographicMatrix(
        -halfWidth,
        halfWidth,
        halfHeight,
        -halfHeight,
        nearZ,
        farZ,
      );
      this._camera.projectionMatrix.elements[8] = (-offset.x * 2) / t.width;
      this._camera.projectionMatrix.elements[9] = (offset.y * 2) / t.height;
    } else {
      this._camera.projectionMatrix = makePerspectiveMatrix(
        t._fov,
        w / h,
        nearZ,
        farZ,
      );
      this._camera.projectionMatrix.elements[8] = (-offset.x * 2) / t.width;
      this._camera.projectionMatrix.elements[9] = (offset.y * 2) / t.height;
    }

    this._camera.projectionMatrixInverse = this._camera.projectionMatrix
      .clone()
      .invert();

    this._camera.aspect = t.width / t.height;

    const cameraMatrix = this.calcCameraMatrix(
      t._pitch,
      t.angle,
      undefined,
      this._camera.matrix.identity(),
    );
    if (isOrthographic) {
      cameraMatrix.elements[14] = cameraAltitude;
    } else if (t.elevation) {
      cameraMatrix.elements[14] = t._camera.position[2] * worldSize;
    }

    this._camera.updateMatrixWorld(true);

    const zoomPow = t.scale * this._worldSizeRatio;
    this.__tempScaleMat.makeScale(zoomPow, zoomPow, zoomPow);

    const x = t.point.x;
    const y = t.point.y;
    this.__tempTranslateMat.makeTranslation(-x, y, 0);
    this.__tempRotateMat.makeRotationZ(Math.PI);

    this.__tempMatrix4
      .identity()
      .premultiply(this.__tempRotateMat)
      .premultiply(this.translateCenter)
      .premultiply(this.__tempScaleMat)
      .premultiply(this.__tempTranslateMat);
    this.world.matrix.copy(this.__tempMatrix4);
    this.world.updateMatrixWorld(true);
  }

  getCamera(): PerspectiveCamera {
    return this._camera;
  }

  setCamera(camera: PerspectiveCamera): void {
    this._camera = camera;
    this._camera.matrixAutoUpdate = false;
  }

  /** Set projection mode; call `update()` after any pre-update matrix changes (e.g. georeference root). */
  setOrthographic(isOrthographic: boolean): void {
    this._isOrthographic = isOrthographic;
  }

  private worldSize(): number {
    const t = this.map.transform;
    return t.tileSize * t.scale;
  }

  private mercatorZfromAltitude(altitude: number, lat: number): number {
    return altitude / this.circumferenceAtLatitude(lat);
  }

  private circumferenceAtLatitude(latitude: number): number {
    return (
      ThreeboxConstants.EARTH_CIRCUMFERENCE *
      Math.cos((latitude * Math.PI) / 180)
    );
  }

  private calcCameraMatrix(
    pitch?: number,
    angle?: number,
    _trz?: Matrix4,
    target?: Matrix4,
  ): Matrix4 {
    const t = this.map.transform;
    const _pitch = pitch === undefined ? t._pitch : pitch;
    const _angle = angle === undefined ? t.angle : angle;
    const trz = _trz === undefined ? this.cameraTranslateZ : _trz;

    const _target = target ?? new Matrix4();
    return _target
      .premultiply(trz)
      .premultiply(this.__tempRotateMat.makeRotationX(_pitch))
      .premultiply(this.__tempScaleMat.makeRotationZ(_angle));
  }
}
