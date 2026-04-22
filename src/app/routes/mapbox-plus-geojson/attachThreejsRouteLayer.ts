import { MercatorCoordinate } from 'mapbox-gl';
import {
  Camera,
  CurvePath,
  LineCurve3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

import {
  computeModelTransform,
  lngLatToLocalPosition,
  multiplyMapboxViewProjectionByModelTransform,
} from '../../../lib/mapbox';

import type { AirspaceRoute } from '../../../lib/mapbox';
import type { CustomLayerInterface, Map as MapboxMap } from 'mapbox-gl';

const THREEJS_ROUTE_LAYER_ID = 'threejs-route-layer';

export interface ThreejsRouteLayerController {
  detach: () => void;
}

/**
 * Attaches the route demo Three.js custom layer to the current map.
 */
export function attachThreejsRouteLayer(
  map: MapboxMap,
  route: AirspaceRoute | undefined,
): ThreejsRouteLayerController {
  const existingLayer = map.getLayer(THREEJS_ROUTE_LAYER_ID);
  if (existingLayer) {
    map.removeLayer(THREEJS_ROUTE_LAYER_ID);
  }

  /** ---------- Three.js Concepts ---------- */
  // To display anything using three.js, we need three things:
  //   1. A scene - made up of one or more meshes (geometry + material)
  //   2. A camera - to look at the scene
  //   3. A renderer - to display the scene
  const threeScene = new Scene();
  const threeCamera = new Camera();

  // The renderer will be created in the onAdd callback when mapbox gives it
  // a canvas and a WebGL context.
  let threeRenderer: WebGLRenderer | undefined;
  let routeObject: Mesh<TubeGeometry, MeshBasicMaterial> | undefined;

  // Converts local coordinates into Mapbox's Mercator world coordinates.
  const mapModelTransform = new Matrix4();

  // The georeference longitude and latitude is the first point of the route.
  // It is used to convert between map coordinates and world coordinates.
  const georeferenceLngLat: [number, number] =
    route && route.coordinates.length > 0
      ? [route.coordinates[0][0], route.coordinates[0][1]]
      : [map.getCenter().lng, map.getCenter().lat];

  // Applies the georeference origin to the map model transform
  function applyGeoreferenceOrigin(m: MapboxMap): void {
    const terrainElevationM = m.queryTerrainElevation(georeferenceLngLat) ?? 0;
    const originMercator = MercatorCoordinate.fromLngLat(
      georeferenceLngLat,
      terrainElevationM,
    );
    mapModelTransform.copy(computeModelTransform(originMercator));
  }

  function rebuildRouteObject(m: MapboxMap): void {
    routeObject = rebuildRouteObjectForMap(
      m,
      route,
      georeferenceLngLat,
      threeScene,
      routeObject,
    );
  }

  // Create the custom layer object that mapbox will use to register the layer.
  const customLayer: CustomLayerInterface = {
    id: THREEJS_ROUTE_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    onAdd(m, gl) {
      threeCamera.matrixAutoUpdate = false;

      const renderer = new WebGLRenderer({
        canvas: m.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      threeRenderer = renderer;

      applyGeoreferenceOrigin(m);
      rebuildRouteObject(m);

      m.once('idle', () => {
        applyGeoreferenceOrigin(m);
        rebuildRouteObject(m);
        m.triggerRepaint();
      });
    },

    // Mapbox provides mapboxViewProjectionMatrix each frame.
    render(_gl, mapboxViewProjectionMatrix) {
      const renderer = threeRenderer;
      if (!renderer) return;

      multiplyMapboxViewProjectionByModelTransform(
        mapboxViewProjectionMatrix,
        mapModelTransform,
        threeCamera.projectionMatrix,
      );

      renderer.resetState();
      renderer.render(threeScene, threeCamera);
    },

    onRemove() {
      map.setNearClipOffset(0);
      if (routeObject) {
        threeScene.remove(routeObject);
        routeObject.geometry.dispose();
        routeObject.material.dispose();
        routeObject = undefined;
      }
      threeRenderer?.dispose();
      threeRenderer = undefined;
    },
  };

  map.addLayer(customLayer);

  return {
    detach: () => {
      try {
        if (map.getLayer(customLayer.id)) {
          map.removeLayer(customLayer.id);
        }
      } catch {
        // Map/style may already be destroyed during route transition.
      }
    },
  };
}

function rebuildRouteObjectForMap(
  map: MapboxMap,
  route: AirspaceRoute | undefined,
  georeferenceLngLat: [number, number],
  threeScene: Scene,
  currentRouteObject: Mesh<TubeGeometry, MeshBasicMaterial> | undefined,
): Mesh<TubeGeometry, MeshBasicMaterial> | undefined {
  if (currentRouteObject) {
    threeScene.remove(currentRouteObject);
    currentRouteObject.geometry.dispose();
    currentRouteObject.material.dispose();
  }

  if (!route || route.coordinates.length < 2) {
    return undefined;
  }

  const centerTerrainElevationM =
    map.queryTerrainElevation(georeferenceLngLat) ?? 0;
  const originMercator = MercatorCoordinate.fromLngLat(
    georeferenceLngLat,
    centerTerrainElevationM,
  );
  const originScale = originMercator.meterInMercatorCoordinateUnits();

  const points = buildRoutePoints(
    route.coordinates,
    originMercator,
    originScale,
    (lngLat) => map.queryTerrainElevation(lngLat) ?? 0,
    centerTerrainElevationM,
  );

  const routePath = new CurvePath<Vector3>();
  for (let i = 0; i < points.length - 1; i += 1) {
    routePath.add(new LineCurve3(points[i], points[i + 1]));
  }

  const routeGeometry = new TubeGeometry(
    routePath,
    Math.max(points.length * 8, 64),
    0.8,
    8,
    false,
  );
  const routeMaterial = new MeshBasicMaterial({ color: 0x38bdf8 });
  const nextRouteObject = new Mesh(routeGeometry, routeMaterial);
  nextRouteObject.name = 'threejs-route-line';
  nextRouteObject.frustumCulled = false;
  threeScene.add(nextRouteObject);
  return nextRouteObject;
}
function buildRoutePoints(
  routeCoordinates: [number, number, number][],
  originMercator: MercatorCoordinate,
  originScale: number,
  getTerrainElevationMeters: (lngLat: [number, number]) => number,
  centerTerrainElevationMeters: number,
): Vector3[] {
  const points: Vector3[] = [];

  const pushSample = (lng: number, lat: number, altitudeMetersAgl: number) => {
    const local = lngLatToLocalPosition(
      [lng, lat],
      originMercator,
      originScale,
    );
    const terrainElevationMeters = getTerrainElevationMeters([lng, lat]);
    const terrainDeltaMeters =
      terrainElevationMeters - centerTerrainElevationMeters;
    points.push(
      new Vector3(local.x, local.y, terrainDeltaMeters + altitudeMetersAgl),
    );
  };
  for (const [lng, lat, altitudeMetersAgl] of routeCoordinates) {
    pushSample(lng, lat, altitudeMetersAgl);
  }

  return points;
}
