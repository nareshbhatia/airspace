import { createContext } from 'react';

import type { Map as MapboxMap } from 'mapbox-gl';

export interface MapContextValue {
  map: MapboxMap | undefined;
}

export const MapContext = createContext<MapContextValue | null>(null);
