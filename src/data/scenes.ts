import { scene as sceneBoston } from './scene3d-boston-ma';
import { scene as sceneFortCollins } from './scene3d-fort-collins-co';
import { scene as sceneSanMateo } from './scene3d-san-mateo-ca';
import { scene as sceneValentine } from './scene3d-valentine-ne';

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';

export const scenes: AirspaceScene[] = [
  sceneBoston,
  sceneFortCollins,
  sceneSanMateo,
  sceneValentine,
];

export const DEFAULT_SCENE = sceneFortCollins;
