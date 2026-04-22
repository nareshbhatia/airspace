import { useEffect } from 'react';

import { attachThreejsRouteLayer } from './attachThreejsRouteLayer';
import { useMap } from '../../../lib/mapbox';

import type { AirspaceRoute } from '../../../lib/mapbox';

interface ThreejsRouteLayerProps {
  route: AirspaceRoute | undefined;
}

/**
 * Registers the demo Three.js route custom layer.
 */
export function ThreejsRouteLayer({ route }: ThreejsRouteLayerProps) {
  const { map } = useMap();

  // Register the layer when map changes.
  useEffect(() => {
    if (!map) return;
    const controller = attachThreejsRouteLayer(map, route);

    return () => {
      controller.detach();
    };
  }, [map, route]);

  return null;
}
