import type { AirspaceZone } from './AirspaceZone';
import type { UtilityPole } from './UtilityPole';
import type { Waypoint } from './Waypoint';
import type { MapProviderProps } from '../providers/MapProvider';

/** Map init props suitable for serialized scene data (no React-only props). */
export type AirspaceSceneMapProvider = Pick<
  MapProviderProps,
  'center' | 'zoom' | 'pitch' | 'bearing'
>;

export interface AirspaceScene {
  name: string;
  mapProvider: AirspaceSceneMapProvider;
  zones: AirspaceZone[];
  poles: UtilityPole[];
  inspectionRoute: Waypoint[];
}
