import { useCallback, useRef, useState } from 'react';

import { area } from '@turf/area';

import { ZoneEditorDrawBridge } from './ZoneEditorDrawBridge';
import { ZoneEditorMapFit } from './ZoneEditorMapFit';
import { ZoneEditorSidebar } from './ZoneEditorSidebar';
import { ZoneEditorZonesLayer } from './ZoneEditorZonesLayer';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

import type { DrawnZone, ZoneType } from './types';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

/**
 * Zone Editor page for defining and editing zones.
 */
export function ZoneEditorPage() {
  const [zones, setZones] = useState<DrawnZone[]>([]);
  const [activeDrawType, setActiveDrawType] = useState<ZoneType | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const handleZoneSelect = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedZoneId(null);
  }, []);

  const selectedZone =
    selectedZoneId != null
      ? (zones.find((z) => z.id === selectedZoneId) ?? null)
      : null;

  const handleDrawReady = useCallback((draw: MapboxDraw | null) => {
    drawRef.current = draw;
  }, []);

  const handleDrawCreate = useCallback(
    (e: { features?: GeoJSON.Feature[] }) => {
      // Get the first feature
      const feature = e.features?.[0];
      if (!feature) return;

      // If no type is selected, delete the feature
      if (activeDrawType == null) {
        if (feature.id != null) {
          drawRef.current?.delete([String(feature.id)]);
        }
        return;
      }

      // If the feature is not a polygon, return
      if (!feature.geometry || feature.geometry.type !== 'Polygon') {
        return;
      }

      // Get the geometry
      const geometry = feature.geometry as GeoJSON.Polygon;
      const vertexCount =
        geometry.coordinates.length > 0
          ? geometry.coordinates[0].length - 1 // Subtract 1 to exclude the closing vertex
          : 0;

      const turfFeature = {
        type: 'Feature' as const,
        properties: {},
        geometry,
      };
      const areaSqKm = area(turfFeature) / 1_000_000;

      // Create the zone
      const zone: DrawnZone = {
        id: crypto.randomUUID(),
        type: activeDrawType,
        geometry,
        areaSqKm,
        vertexCount,
        createdAt: new Date(),
      };

      // Add the zone to the state
      setZones((prev) => [zone, ...prev]);

      // Delete the feature from the map
      if (feature.id != null) {
        drawRef.current?.delete([String(feature.id)]);
      }
      setActiveDrawType(null);
      drawRef.current?.changeMode('simple_select');
      console.log('Committed zone:', zone);
    },
    [activeDrawType],
  );

  const handleSelectType = useCallback((type: ZoneType) => {
    setActiveDrawType(type);
    drawRef.current?.changeMode('draw_polygon');
  }, []);

  const handleCancel = useCallback(() => {
    drawRef.current?.deleteAll();
    drawRef.current?.changeMode('simple_select');
    setActiveDrawType(null);
  }, []);

  const handleDeleteZone = useCallback(
    (zoneId: string) => {
      if (zoneId === selectedZoneId) {
        setSelectedZoneId(null);
      }
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    },
    [selectedZoneId],
  );

  return (
    <div className="relative flex flex-1 min-h-0">
      <ZoneEditorSidebar
        zones={zones}
        activeDrawType={activeDrawType}
        selectedZoneId={selectedZoneId}
        onSelectType={handleSelectType}
        onSelectZone={handleZoneSelect}
        onCancel={handleCancel}
        onDeleteZone={handleDeleteZone}
      />
      <div className="relative min-w-0 flex-1">
        <MapProvider
          style="mapbox://styles/mapbox/satellite-streets-v12"
          center={airportById.get('BOS')?.coordinates}
          zoom={12}
          className="w-full h-full"
        >
          <ZoneEditorMapFit selectedZone={selectedZone} />
          <ZoneEditorZonesLayer
            zones={zones}
            selectedZoneId={selectedZoneId}
            onZoneSelect={handleZoneSelect}
            onDeselect={handleDeselect}
          />
          <ZoneEditorDrawBridge
            onDrawReady={handleDrawReady}
            onDrawCreate={handleDrawCreate}
          />
        </MapProvider>
      </div>
    </div>
  );
}
