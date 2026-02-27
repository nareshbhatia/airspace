import { useCallback, useEffect, useMemo, useState } from 'react';

import { StationInfoCard } from './StationInfoCard';
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
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const url = new URL('./nyc-subway-stops.geojson', import.meta.url).href;
    fetch(url)
      .then((res) => res.json())
      .then((json) => setGeoJson(json as GeoJSON.FeatureCollection));
  }, []);

  const stations = useMemo(
    () => (geoJson ? parseStations(geoJson) : []),
    [geoJson],
  );
  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? null,
    [stations, selectedStationId],
  );

  const handleStationClick = useCallback((id: number) => {
    setSelectedStationId(id);
  }, []);
  const handleDeselect = useCallback(() => {
    setSelectedStationId(null);
  }, []);

  return (
    <div className="relative flex-1">
      <MapProvider
        style="mapbox://styles/mapbox/standard"
        center={[-73.92, 40.74]}
        zoom={11}
        className="w-full h-full"
      >
        <SubwayStopsLayer
          data={geoJson}
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
