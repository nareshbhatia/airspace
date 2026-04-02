import { scene as sceneFortCollins } from './scene3d-fort-collins';
import { scene as sceneJohnHancock } from './scene3d-john-hancock';
import { scene as sceneNebraska } from './scene3d-nebraska';
import { scene as sceneSanMateo } from './scene3d-san-mateo';

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';

export const scenes: AirspaceScene[] = [
  sceneJohnHancock,
  sceneFortCollins,
  sceneSanMateo,
  sceneNebraska,
];

export const DEFAULT_SCENE = sceneFortCollins;
