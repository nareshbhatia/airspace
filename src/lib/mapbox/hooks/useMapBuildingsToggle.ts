import { useEffect } from 'react';

import { useMap } from './useMap';

/**
 * Toggles Standard style 3D building rendering via basemap config properties.
 */
export function useMapBuildingsToggle(isBuildingsEnabled: boolean): void {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const applyConfig = () => {
      map.setConfigProperty('basemap', 'show3dBuildings', isBuildingsEnabled);
      map.setConfigProperty('basemap', 'show3dLandmarks', isBuildingsEnabled);
      map.setConfigProperty('basemap', 'show3dFacades', isBuildingsEnabled);
    };

    if (map.isStyleLoaded()) applyConfig();

    map.on('style.load', applyConfig);
    return () => {
      map.off('style.load', applyConfig);
    };
  }, [map, isBuildingsEnabled]);
}
