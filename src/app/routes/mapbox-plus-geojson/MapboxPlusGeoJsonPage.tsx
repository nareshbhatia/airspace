import { useEffect, useState } from 'react';

import { MapBoxRouteFit } from './MapBoxRouteFit';
import { MapboxRouteLayer } from './MapboxRouteLayer';
import { ThreejsRouteLayer } from './ThreejsRouteLayer';
import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import {
  BearingDisplay,
  MapPanel,
  MapProvider,
  MapSearchBox,
  MapViewModeToggle,
  PitchDisplay,
  useMapViewMode,
  ZoomLevelDisplay,
} from '../../../lib/mapbox';
import { constants } from '../../../utils/constants';

import type { AirspaceRoute, MapViewMode } from '../../../lib/mapbox';

interface MapboxOverlayProps {
  mapViewMode: MapViewMode;
  onMapViewModeChange: (mode: MapViewMode) => void;
}

function MapboxOverlay({
  mapViewMode,
  onMapViewModeChange,
}: MapboxOverlayProps) {
  // Apply 2D vs 3D to the map view
  useMapViewMode(mapViewMode);

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 min-w-40">
      <MapPanel>
        <ZoomLevelDisplay />
        <PitchDisplay />
        <BearingDisplay />
        <MapViewModeToggle
          mode={mapViewMode}
          onModeChange={onMapViewModeChange}
        />
      </MapPanel>
    </div>
  );
}

/**
 * Show GeoJSON on maps
 */
export function MapboxPlusGeoJsonPage() {
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');
  const [route, setRoute] = useState<AirspaceRoute>();

  useEffect(() => {
    const url = new URL('./data/fort-collins.json', import.meta.url).href;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load the route: ${res.status}`);
        return res.json();
      })
      .then((json) => setRoute(json as AirspaceRoute))
      .catch((err) => {
        console.error('Route load error:', err);
      });
  }, []);

  return (
    <div className="relative flex-1">
      <MapProvider
        style={MAPBOX_STANDARD_SATELLITE_STYLE}
        center={constants.US_CENTER}
        zoom={constants.US_ZOOM}
        className="w-full h-full"
        mapOptions={{ antialias: true }}
        enableTerrain
      >
        <MapSearchBox
          options={{ language: 'en', country: 'US' }}
          placeholder="Search for a place"
        />
        <MapboxOverlay
          mapViewMode={mapViewMode}
          onMapViewModeChange={setMapViewMode}
        />
        <MapBoxRouteFit route={route} />
        <MapboxRouteLayer route={route} />
        <ThreejsRouteLayer route={route} />
      </MapProvider>
    </div>
  );
}
