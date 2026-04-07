import { MercatorCoordinate } from 'mapbox-gl';
import {
  AmbientLight,
  Camera,
  DirectionalLight,
  Group,
  Line,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Scene,
  WebGLRenderer,
} from 'three';

import { buildMapboxAirspaceZoneGroup } from './buildMapboxAirspaceZoneGroup';
import { buildMapboxPoleGroup } from './buildMapboxPoleGroup';
import { buildMapboxRouteLine } from './buildMapboxRouteLine';
import { getSceneCenterLngLat } from './georeference';
import {
  composeThreeCameraProjectionMatrixFromMapboxCustomLayer,
  computeMapboxNearClipOffsetPixelsForOverlay,
} from './mapboxCustomLayerCameraBridge';
import { computeModelTransform } from '../../../lib/mapbox/utils/mercatorUtils';

import type {
  MapboxPlusThreeLayerApi,
  ProjectionMode,
  ThreeSceneData,
  ThreeSceneVisibilityState,
} from './types';
import type { CustomLayerInterface, Map as MapboxMap } from 'mapbox-gl';

interface MapboxThreeCustomLayerOptions {
  initialProjectionMode: ProjectionMode;
  initialSceneData: ThreeSceneData;
  initialVisibilityState: ThreeSceneVisibilityState;
  maxOrthoContentHeightM: number;
  orthographicVerticalScale: number;
}

interface BuiltContentGroups {
  rootGroup: Group;
  zonesGroup: Group;
  polesGroup?: Group;
  routeGroup?: Object3D;
}

/**
 * Mapbox custom layer that renders the operational scene in Three.js.
 *
 * Flow summary:
 * 1. Mapbox drives each frame and provides a per-frame projection matrix.
 * 2. Three.js `projectionMatrix` is composed in `mapboxCustomLayerCameraBridge.ts`
 *    (matrix × georeference).
 * 3. Orthographic mode: `setNearClipOffset` for **near-plane / frustum** clipping
 *    of tall overlays; optional root-group Y scale for **depth-range** mitigation
 *    when the far plane cannot be tuned (see file-level doc on the bridge module).
 */
export class MapboxThreeCustomLayer
  implements CustomLayerInterface, MapboxPlusThreeLayerApi
{
  readonly id = 'mapbox-plus-threejs-layer';

  readonly type = 'custom' as const;

  readonly renderingMode = '3d' as const;

  private mapInstance: MapboxMap | undefined;

  private threeRenderer: WebGLRenderer | undefined;

  private readonly threeCamera = new Camera();

  private readonly threeScene = new Scene();

  private overlayProjectionMode: ProjectionMode;

  private sceneData: ThreeSceneData;

  private visibilityState: ThreeSceneVisibilityState;

  private mapModelTransform = new Matrix4();

  private currentContentRootGroup: Group | undefined;

  private currentZonesGroup: Group | undefined;

  private currentPolesGroup: Group | undefined;

  private currentRouteGroup: Object3D | undefined;

  private readonly mapOrthoMaxContentHeightM: number;

  private readonly threeOrthoVerticalScale: number;

  private renderCount = 0;

  private lastBuiltCenterTerrainElevationM = 0;

  private hasRebuiltAfterTerrainResolved = false;

  constructor(options: MapboxThreeCustomLayerOptions) {
    this.overlayProjectionMode = options.initialProjectionMode;
    this.sceneData = options.initialSceneData;
    this.visibilityState = options.initialVisibilityState;
    this.mapOrthoMaxContentHeightM = options.maxOrthoContentHeightM;
    this.threeOrthoVerticalScale = options.orthographicVerticalScale;
  }

  /**
   * ---------- Public API: projection ----------
   * Called by the page/facade when map mode changes (2D/3D).
   */
  setProjectionMode(projectionMode: ProjectionMode): void {
    this.overlayProjectionMode = projectionMode;
    this.applyModeDrivenSceneTuning();
  }

  /**
   * ---------- Public API: scene data ----------
   * Rebuilds scene content for the newly selected scene.
   */
  setSceneData(nextData: ThreeSceneData): void {
    this.hasRebuiltAfterTerrainResolved = false;
    this.sceneData = nextData;
    this.rebuildContentFromSceneData();
  }

  /**
   * ---------- Public API: visibility ----------
   * Keeps overlay layer toggles functional for Three.js content groups.
   */
  setVisibilityState(nextVisibilityState: ThreeSceneVisibilityState): void {
    this.visibilityState = nextVisibilityState;
    this.applyVisibilityState();
  }

  /**
   * ---------- Mapbox Custom Layer Lifecycle: onAdd ----------
   * Create Three renderer + camera + content graph using Mapbox WebGL context.
   */
  onAdd(map: MapboxMap, gl: WebGL2RenderingContext): void {
    this.mapInstance = map;

    const threeRenderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    threeRenderer.autoClear = false;
    this.threeRenderer = threeRenderer;

    this.threeCamera.matrixAutoUpdate = false;

    this.threeScene.add(new AmbientLight(0xffffff, 0.55));
    const sunLight = new DirectionalLight(0xffffff, 1.05);
    sunLight.position.set(220, 420, 180);
    this.threeScene.add(sunLight);

    this.rebuildContentFromSceneData();
    this.applyModeDrivenSceneTuning();

    map.once('idle', () => {
      if (!this.mapInstance) return;
      this.rebuildContentFromSceneData();
      map.triggerRepaint();
    });
  }

  /**
   * ---------- Mapbox Custom Layer Lifecycle: render ----------
   * Mapbox provides `mapMatrix` every frame; Three camera derives projection from it.
   */
  render(_gl: WebGL2RenderingContext, mapMatrix: number[]): void {
    const map = this.mapInstance;
    const renderer = this.threeRenderer;
    if (!map || !renderer) return;

    const threeCameraProjectionMatrix =
      composeThreeCameraProjectionMatrixFromMapboxCustomLayer(
        mapMatrix,
        this.mapModelTransform,
      );
    this.threeCamera.projectionMatrix = threeCameraProjectionMatrix;

    const mapboxNearClipOffsetPixels =
      computeMapboxNearClipOffsetPixelsForOverlay(
        map,
        this.overlayProjectionMode,
        this.mapOrthoMaxContentHeightM,
      );
    map.setNearClipOffset(mapboxNearClipOffsetPixels);

    renderer.resetState();
    renderer.render(this.threeScene, this.threeCamera);

    this.renderCount += 1;
    if (this.renderCount % 30 === 0) {
      this.maybeRebuildAfterTerrainResolves();
    }
  }

  /**
   * ---------- Mapbox Custom Layer Lifecycle: onRemove ----------
   * Free GPU resources and always restore near-clip offset back to default.
   */
  onRemove(): void {
    this.mapInstance?.setNearClipOffset(0);

    if (this.currentContentRootGroup) {
      this.threeScene.remove(this.currentContentRootGroup);
      disposeSceneContentGroup(this.currentContentRootGroup);
      this.currentContentRootGroup = undefined;
      this.currentZonesGroup = undefined;
      this.currentPolesGroup = undefined;
      this.currentRouteGroup = undefined;
    }

    this.threeRenderer?.dispose();
    this.threeRenderer = undefined;
    this.mapInstance = undefined;
  }

  /**
   * ---------- Content Builder ----------
   * Rebuild Three groups using local georeference center for the selected scene.
   */
  private rebuildContentFromSceneData(): void {
    const map = this.mapInstance;
    const currentScene = this.sceneData.scene;
    const centerLngLat = getSceneCenterLngLat(currentScene);
    const terrainElevationSampler = (lngLat: [number, number]): number =>
      map?.queryTerrainElevation(lngLat) ?? 0;
    const centerTerrainElevationM = terrainElevationSampler(centerLngLat);
    this.lastBuiltCenterTerrainElevationM = centerTerrainElevationM;

    /**
     * Anchor the scene at the center terrain elevation so local altitude values
     * stay small. Per-feature geometry then uses terrain delta from center
     * rather than full absolute MSL height, which improves precision.
     */
    const originMercator = MercatorCoordinate.fromLngLat(
      centerLngLat,
      centerTerrainElevationM,
    );
    this.mapModelTransform = computeModelTransform(originMercator);

    if (this.currentContentRootGroup) {
      this.threeScene.remove(this.currentContentRootGroup);
      disposeSceneContentGroup(this.currentContentRootGroup);
      this.currentContentRootGroup = undefined;
    }

    const built = buildContentGroups(
      currentScene.zones,
      currentScene.poles,
      currentScene.route,
      centerLngLat,
      terrainElevationSampler,
      centerTerrainElevationM,
    );
    this.currentContentRootGroup = built.rootGroup;
    this.currentZonesGroup = built.zonesGroup;
    this.currentPolesGroup = built.polesGroup;
    this.currentRouteGroup = built.routeGroup;

    this.threeScene.add(built.rootGroup);
    this.applyVisibilityState();
    this.applyModeDrivenSceneTuning();

    this.mapInstance?.triggerRepaint();
  }

  /**
   * ---------- Visibility ----------
   * Applies UI toggle state to the scene groups.
   */
  private applyVisibilityState(): void {
    if (this.currentZonesGroup) {
      this.currentZonesGroup.visible = this.visibilityState.zones;
    }
    if (this.currentPolesGroup) {
      this.currentPolesGroup.visible = this.visibilityState.poles;
    }
    if (this.currentRouteGroup) {
      this.currentRouteGroup.visible = this.visibilityState.route;
    }
  }

  /**
   * ---------- Mode Tuning ----------
   * Non-obvious but intentional:
   * - Orthographic mode applies vertical compression as a practical depth-range
   *   mitigation when map far-plane cannot be directly tuned.
   * - Perspective mode restores native scale.
   */
  private applyModeDrivenSceneTuning(): void {
    if (!this.currentContentRootGroup) return;
    if (this.overlayProjectionMode === 'orthographic') {
      this.currentContentRootGroup.scale.y = this.threeOrthoVerticalScale;
    } else {
      this.currentContentRootGroup.scale.y = 1;
    }
  }

  /**
   * If the first geometry bake happened before DEM data was ready, terrain will
   * be sampled as 0 and the scene can end up hidden under real terrain. Recheck
   * occasionally and rebuild once when a meaningful terrain elevation becomes
   * available.
   */
  private maybeRebuildAfterTerrainResolves(): void {
    const map = this.mapInstance;
    if (!map) return;
    if (map.getTerrain() == null) return;
    if (this.hasRebuiltAfterTerrainResolved) return;

    const centerLngLat = getSceneCenterLngLat(this.sceneData.scene);
    const sampledTerrainElevationM =
      map.queryTerrainElevation(centerLngLat) ?? 0;
    if (
      this.lastBuiltCenterTerrainElevationM <= 0.25 &&
      sampledTerrainElevationM > 0.25
    ) {
      this.hasRebuiltAfterTerrainResolved = true;
      this.rebuildContentFromSceneData();
    }
  }
}

function buildContentGroups(
  zones: ThreeSceneData['scene']['zones'],
  poles: ThreeSceneData['scene']['poles'],
  route: ThreeSceneData['scene']['route'],
  centerLngLat: [number, number],
  getTerrainElevationMeters: (lngLat: [number, number]) => number,
  centerTerrainElevationM: number,
): BuiltContentGroups {
  const rootGroup = new Group();
  const zonesGroup = buildMapboxAirspaceZoneGroup(
    zones,
    centerLngLat,
    getTerrainElevationMeters,
    centerTerrainElevationM,
  );
  rootGroup.add(zonesGroup);

  const polesGroup = buildMapboxPoleGroup(
    poles,
    centerLngLat,
    getTerrainElevationMeters,
    centerTerrainElevationM,
  );
  if (polesGroup) {
    rootGroup.add(polesGroup);
  }

  const routeGroup = buildMapboxRouteLine(
    route,
    centerLngLat,
    getTerrainElevationMeters,
    centerTerrainElevationM,
  );
  if (routeGroup) {
    rootGroup.add(routeGroup);
  }

  /**
   * Frustum culling fix:
   * In this custom-layer pipeline we only set camera.projectionMatrix (from
   * Mapbox's per-frame matrix × modelTransform). We never set
   * camera.matrixWorldInverse, so it stays as identity. Three.js computes the
   * frustum from projectionMatrix × matrixWorldInverse — with identity inverse
   * the frustum is wrong and culls all geometry after bounding spheres are
   * computed (typically frame 2-3). Disabling frustumCulled on every renderable
   * prevents this. This matches what Threebox does internally.
   */
  rootGroup.traverse((child) => {
    child.frustumCulled = false;
  });

  return { rootGroup, zonesGroup, polesGroup, routeGroup };
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
