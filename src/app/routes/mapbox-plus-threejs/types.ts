import type { AirspaceScene } from '../../../lib/mapbox';

export type ProjectionMode = 'perspective' | 'orthographic';

export type ThreeSceneLayerGroupId = 'zones' | 'poles' | 'route';

export interface ThreeSceneVisibilityState {
  zones: boolean;
  poles: boolean;
  route: boolean;
}

export interface ThreeSceneData {
  scene: AirspaceScene;
}

export interface MapboxPlusThreeLayerApi {
  readonly id: string;
  setProjectionMode: (projectionMode: ProjectionMode) => void;
  setSceneData: (nextData: ThreeSceneData) => void;
  setVisibilityState: (nextVisibilityState: ThreeSceneVisibilityState) => void;
}
