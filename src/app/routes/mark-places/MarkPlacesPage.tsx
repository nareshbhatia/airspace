import { useCallback, useState } from 'react';

import { PlacesList } from './PlacesList';
import { PlacesView } from './PlacesView';
import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { airportById } from '../../../gen/airports';
import {
  MapProvider,
  MapSearchBox,
  MapViewModeToggle,
  BearingDisplay,
  MapPanel,
  PitchDisplay,
  ZoomLevelDisplay,
  useMapViewMode,
} from '../../../lib/mapbox';

import type { MapClickEvent } from './PlacesView';
import type { Place } from './types/Place';
import type { MapViewMode } from '../../../lib/mapbox';

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

export function MarkPlacesPage() {
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();

  const handleMapClick = useCallback((event: MapClickEvent) => {
    const place = {
      id: crypto.randomUUID(),
      coordinates: event.lngLat,
    };
    setPlaces((prev) => [...prev, place]);
  }, []);

  const handlePlaceSelected = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
  }, []);

  const handlePlaceDeleted = useCallback((placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    setSelectedPlaceId((prev) => (prev === placeId ? undefined : prev));
  }, []);

  return (
    <div className="relative flex flex-1 min-h-0">
      <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-background">
        <div className="border-b border-border px-3 py-2 text-sm font-medium">
          Places
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <PlacesList
            places={places}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelected={handlePlaceSelected}
            onPlaceDeleted={handlePlaceDeleted}
          />
        </div>
      </aside>
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style={MAPBOX_STANDARD_SATELLITE_STYLE}
          center={airportById.get('BOS')?.coordinates}
          zoom={14}
          className="w-full h-full"
          enableTerrain={true}
        >
          <MapSearchBox
            options={{ language: 'en', country: 'US' }}
            placeholder="Search for a place"
          />
          <PlacesView
            places={places}
            selectedPlaceId={selectedPlaceId}
            onMapClick={handleMapClick}
          />
          <MapboxOverlay
            mapViewMode={mapViewMode}
            onMapViewModeChange={setMapViewMode}
          />
        </MapProvider>
      </div>
    </div>
  );
}
