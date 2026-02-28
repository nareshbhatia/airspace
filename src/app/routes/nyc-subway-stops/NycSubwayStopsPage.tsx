import { useCallback, useEffect, useMemo, useState } from 'react';

import { StationInfoCard } from './StationInfoCard';
import { SubwayRoutesLayer } from './SubwayRoutesLayer';
import { SubwayStopsLayer } from './SubwayStopsLayer';
import { MapProvider } from '../../../lib/mapbox';

import type { Station } from './types/Station';

function parseStations(fc: GeoJSON.FeatureCollection): Station[] {
  return (fc.features ?? [])
    .filter(
      (f): f is GeoJSON.Feature<GeoJSON.Point> =>
        f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates),
    )
    .map((f) => {
      const props = f.properties as Record<string, unknown>;
      const coords = f.geometry.coordinates as [number, number];
      return {
        id: Number(props.cartodb_id),
        name: String(props.name ?? ''),
        line: String(props.line ?? ''),
        coordinates: coords,
      };
    });
}

export function NycSubwayStopsPage() {
  const [routesGeoJson, setRoutesGeoJson] =
    useState<GeoJSON.FeatureCollection>();
  const [stopsGeoJson, setStopsGeoJson] = useState<GeoJSON.FeatureCollection>();
  const [selectedStationId, setSelectedStationId] = useState<number>();
  const [loadError, setLoadError] = useState<string>();

  // Load routes GeoJSON data
  useEffect(() => {
    const url = new URL('./data/nyc-subway-routes.geojson', import.meta.url)
      .href;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load routes: ${res.status}`);
        return res.json();
      })
      .then((json) => setRoutesGeoJson(json as GeoJSON.FeatureCollection))
      .catch((err) => {
        console.error('NYC subway routes load error:', err);
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load routes',
        );
      });
  }, []);

  // Load stops GeoJSON data
  useEffect(() => {
    const url = new URL('./data/nyc-subway-stops.geojson', import.meta.url)
      .href;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load stops: ${res.status}`);
        return res.json();
      })
      .then((json) => setStopsGeoJson(json as GeoJSON.FeatureCollection))
      .catch((err) => {
        console.error('NYC subway stops load error:', err);
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load stops',
        );
      });
  }, []);

  // Avoid recomputing parsed stations on every render; stable reference for selectedStation.
  const stations = useMemo(
    () => (stopsGeoJson ? parseStations(stopsGeoJson) : []),
    [stopsGeoJson],
  );

  // Recompute only when stations or selection changes; avoids new reference when find result is unchanged.
  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId),
    [stations, selectedStationId],
  );

  const handleStationClick = useCallback((id: number) => {
    setSelectedStationId(id);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedStationId(undefined);
  }, []);

  return (
    <div className="relative flex-1">
      {loadError && (
        <div
          className="absolute top-4 left-4 right-4 z-10 rounded bg-destructive/90 px-3 py-2 text-sm text-destructive-foreground"
          role="alert"
        >
          {loadError}
        </div>
      )}
      <MapProvider
        style="mapbox://styles/mapbox/light-v11"
        center={[-73.92, 40.74]}
        zoom={11}
        className="w-full h-full"
      >
        <SubwayRoutesLayer data={routesGeoJson} />
        <SubwayStopsLayer
          data={stopsGeoJson}
          selectedStationId={selectedStationId}
          onStationClick={handleStationClick}
          onDeselect={handleDeselect}
        />
      </MapProvider>
      {selectedStation && (
        <div className="absolute top-4 right-4 pointer-events-none z-10">
          <StationInfoCard station={selectedStation} />
        </div>
      )}
    </div>
  );
}
