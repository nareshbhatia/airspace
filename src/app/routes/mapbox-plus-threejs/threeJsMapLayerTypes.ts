export type ProjectionMode = 'perspective' | 'orthographic';

export type CameraSyncStrategy = 'mapbox-matrix' | 'camera-sync';

export interface ThreeJsMapCustomLayer {
  readonly id: string;
  setProjectionMode(mode: ProjectionMode): void;
}
