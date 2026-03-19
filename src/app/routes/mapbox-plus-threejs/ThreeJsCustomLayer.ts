import { MercatorCoordinate } from 'mapbox-gl';
import {
  AmbientLight,
  Camera,
  CylinderGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Scene,
  Vector3,
  DirectionalLight,
  WebGLRenderer,
} from 'three';

import { utilityPoles } from '../../../data/scene3d';
import { UTILITY_POLE_RADIUS_M } from '../../../lib/mapbox/types/UtilityPole';

import type { Map as MapboxMap } from 'mapbox-gl';
import type { BufferGeometry, Material } from 'three';

/**
 * Mapbox custom layer that renders Three.js content in the map's WebGL pipeline.
 *
 * Follows the Mapbox "add-3d-model" example pattern: bake a model transform
 * (translation to MercatorCoordinate + meter-to-Mercator scale + axis rotation)
 * into the camera's projectionMatrix each frame.
 *
 * Step 6: utility poles rendered as cylinders at geographic positions.
 */
export class ThreeJsCustomLayer {
  readonly id = 'threejs-layer';

  readonly type = 'custom' as const;

  readonly renderingMode = '3d' as const;

  private _map: MapboxMap | undefined;

  private _scene: Scene | undefined;

  private _camera: Camera | undefined;

  private _renderer: WebGLRenderer | undefined;

  /**
   * Reference MercatorCoordinate used as the scene origin.
   * All pole meshes are positioned relative to this point (in meters)
   * so that the model transform can be baked into the camera matrix.
   */
  private _originMerc: MercatorCoordinate | undefined;

  private _originScale = 1;

  onAdd(map: MapboxMap, gl: WebGL2RenderingContext): void {
    this._map = map;
    const renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    renderer.autoClear = false;

    const scene = new Scene();
    const camera = new Camera();

    // Step 6: PBR (MeshStandardMaterial) requires lights to be visible.
    // AmbientLight provides uniform fill; DirectionalLight simulates sunlight.
    scene.add(new AmbientLight(0xffffff, 0.6));
    const sun = new DirectionalLight(0xffffff, 0.9);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Use the first pole's position as the scene origin in MercatorCoordinate space.
    const refPole = utilityPoles[0];
    if (!refPole) return; // no poles to render

    const originMerc = MercatorCoordinate.fromLngLat(
      [refPole.lng, refPole.lat],
      0,
    );
    const originScale = originMerc.meterInMercatorCoordinateUnits();
    this._originMerc = originMerc;
    this._originScale = originScale;

    const statusColors: Record<string, number> = {
      nominal: 0x22c55e,
      flagged: 0xef4444,
      inspected: 0x9ca3af,
    };

    for (const pole of utilityPoles) {
      const merc = MercatorCoordinate.fromLngLat([pole.lng, pole.lat], 0);
      const poleHeightM = pole.inspectionAltM;

      // Position is an offset from the scene origin, converted from Mercator
      // units back into Three.js "meters near origin" coordinates.
      //
      // Note: `render()` applies `scale(new Vector3(scale, -scale, scale))` in
      // the model transform, so Three.js local Y is negated before being
      // translated into Mercator space. To land at the correct
      // `MercatorCoordinate.y` (where Y increases south), we invert the Mercator
      // Y delta here.
      const offsetXm = (merc.x - originMerc.x) / originScale;
      const offsetYm = (originMerc.y - merc.y) / originScale;

      const material = new MeshStandardMaterial({
        color: statusColors[pole.status] ?? 0xffffff,
      });
      const poleGeometry = new CylinderGeometry(
        UTILITY_POLE_RADIUS_M,
        UTILITY_POLE_RADIUS_M,
        poleHeightM,
        12,
      );
      const mesh = new Mesh(poleGeometry, material);

      // Scene-meters placement:
      // - X: east/west offset (Mercator X delta)
      // - Y: north/south offset (Mercator Y delta; Mercator Y increases south)
      // - Z: altitude above ground (Mercator Z).
      //
      // CylinderGeometry is centered on the local Y axis, and we rotate the mesh
      // so the cylinder's height axis lines up with Mercator Z. After that
      // rotation, placing the mesh at `z = poleHeightM/2` means the pole bottom
      // sits at ground level (AGL=0) and the top reaches `inspectionAltM`.
      //
      // `inspectionAltM` is defined as drone inspection altitude (AGL), i.e.
      // the pole is drawn from 0 -> inspectionAltM above ground.
      mesh.position.set(offsetXm, offsetYm, poleHeightM / 2);
      // Orient cylinder so its length aligns with Mapbox's vertical axis.
      mesh.rotation.x = Math.PI / 2;
      // With custom layer matrices, Three.js frustum culling can be fragile.
      // Disabling it is acceptable for a small number of objects.
      mesh.frustumCulled = false;

      scene.add(mesh);
    }

    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;
  }

  render(gl: WebGL2RenderingContext, matrix: number[]): void {
    if (
      !this._map ||
      !this._camera ||
      !this._scene ||
      !this._renderer ||
      !this._originMerc
    )
      return;

    const merc = this._originMerc;
    const scale = this._originScale;

    // Model transform: translate to Mercator origin, scale meters -> Mercator units.
    // IMPORTANT: Do not bake rotation into this matrix; apply orientation on meshes.
    const modelTransform = new Matrix4()
      .makeTranslation(merc.x, merc.y, merc.z)
      .scale(new Vector3(scale, -scale, scale));

    // camera.projectionMatrix = mapboxViewProjMatrix * modelTransform
    const m = new Matrix4().fromArray(matrix);
    this._camera.projectionMatrix = m.multiply(modelTransform);

    this._renderer.resetState();

    // Mapbox renders first and writes to the shared depth buffer. Clearing depth
    // ensures our custom content isn't rejected by the depth test while debugging.
    gl.clearDepth(1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    this._renderer.render(this._scene, this._camera);
    this._map.triggerRepaint();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(_map: MapboxMap, _gl: WebGL2RenderingContext): void {
    // Three.js does not garbage-collect GPU resources automatically
    // Traversing the scene and dispose each object before clearing the private fields
    this._scene?.traverse((obj) => {
      if (obj instanceof Mesh) {
        (obj.geometry as BufferGeometry).dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          (obj.material as Material).dispose();
        }
      }
    });

    this._renderer?.dispose();
    this._map = undefined;
    this._scene = undefined;
    this._camera = undefined;
    this._renderer = undefined;
    this._originMerc = undefined;
  }
}
