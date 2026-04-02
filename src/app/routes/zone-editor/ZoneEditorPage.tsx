import { useCallback, useRef, useState } from 'react';

import { area } from '@turf/area';

import { ZoneEditorDrawBridge } from './ZoneEditorDrawBridge';
import { ZoneEditorMapFit } from './ZoneEditorMapFit';
import { ZoneEditorSidebar } from './ZoneEditorSidebar';
import { ZoneEditorZonesLayer } from './ZoneEditorZonesLayer';
import { MAPBOX_STANDARD_SATELLITE_STYLE } from '../../../config/MapConfig';
import { airportById } from '../../../gen/airports';
import { MapProvider } from '../../../lib/mapbox';

import type { DrawnZone, ZoneType } from './types';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

function geometryToZoneProps(geometry: GeoJSON.Polygon): {
  areaSqKm: number;
  vertexCount: number;
} {
  const vertexCount =
    geometry.coordinates.length > 0 ? geometry.coordinates[0].length - 1 : 0;
  const turfFeature = {
    type: 'Feature' as const,
    properties: {},
    geometry,
  };
  const areaSqKm = area(turfFeature) / 1_000_000;
  return { areaSqKm, vertexCount };
}

/**
 * Zone Editor page for defining and editing zones.
 */
export function ZoneEditorPage() {
  const [zones, setZones] = useState<DrawnZone[]>([]);
  const [activeDrawType, setActiveDrawType] = useState<ZoneType | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const editingZoneIdRef = useRef<string | null>(null);

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

  // Handle select zone type event
  const handleSelectType = useCallback((type: ZoneType) => {
    setActiveDrawType(type);
    drawRef.current?.changeMode('draw_polygon');
  }, []);

  // Handle cancel drawing event
  const handleCancel = useCallback(() => {
    drawRef.current?.deleteAll();
    drawRef.current?.changeMode('simple_select');
    setActiveDrawType(null);
    editingZoneIdRef.current = null;
  }, []);

  // Handle draw create event
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

      const geometry = feature.geometry as GeoJSON.Polygon;
      const { areaSqKm, vertexCount } = geometryToZoneProps(geometry);

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

  // Handle enter edit mode event
  const handleEnterEditMode = useCallback(
    (zoneId: string) => {
      const draw = drawRef.current;
      if (!draw) return;

      // If another zone is already in Draw for editing, commit it first
      const prevEditingId = editingZoneIdRef.current;
      if (prevEditingId != null) {
        const all = draw.getAll();
        const prevFeature = all.features.find(
          (f) =>
            f.id === prevEditingId ||
            (f.properties as { zoneId?: string })?.zoneId === prevEditingId,
        );
        if (prevFeature?.geometry && prevFeature.geometry.type === 'Polygon') {
          const geometry = prevFeature.geometry as GeoJSON.Polygon;
          const { areaSqKm, vertexCount } = geometryToZoneProps(geometry);
          // Persist that zone's edited geometry and derived props to state
          setZones((prevZones) =>
            prevZones.map((z) =>
              z.id === prevEditingId
                ? { ...z, geometry, areaSqKm, vertexCount }
                : z,
            ),
          );
        }
        draw.delete([prevEditingId]);
        editingZoneIdRef.current = null;
      }

      // Get the zone to edit
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;

      // Build a Draw feature using the zone id so we can correlate updates
      const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        id: zone.id,
        geometry: zone.geometry,
        properties: {},
      };
      draw.add(feature);
      draw.changeMode('direct_select', { featureId: zone.id });
      editingZoneIdRef.current = zone.id;
    },
    [zones],
  );

  // Handle draw update event
  const handleDrawUpdate = useCallback(
    (e: { features?: GeoJSON.Feature[] }) => {
      // Get the editing zone id
      const editingId = editingZoneIdRef.current;
      if (editingId == null) return;

      // Get the feature to update
      const feature = e.features?.find(
        (f) =>
          f.id === editingId ||
          (f.properties as { zoneId?: string })?.zoneId === editingId,
      );
      if (!feature?.geometry || feature.geometry.type !== 'Polygon') return;

      // Get the geometry to update and compute derived properties
      const geometry = feature.geometry as GeoJSON.Polygon;
      const { areaSqKm, vertexCount } = geometryToZoneProps(geometry);

      // Update the zone in state
      setZones((prev) =>
        prev.map((z) =>
          z.id === editingId ? { ...z, geometry, areaSqKm, vertexCount } : z,
        ),
      );
    },
    [],
  );

  // Mapbox Draw fires draw.selectionchange when the set of selected features
  // changes (e.g. user clicks outside or presses Escape). When our editing zone
  // is no longer in that set, we treat it as "edit complete": persist geometry
  // to state, remove the feature from Draw, and clear the editing ref.
  const handleDrawSelectionChange = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const editingId = editingZoneIdRef.current;
      if (editingId == null) return;

      // Build set of currently selected feature ids from the event
      const selectedIds = new Set(
        (e.features ?? []).map((f) =>
          f.id != null
            ? String(f.id)
            : (f.properties as { zoneId?: string })?.zoneId,
        ),
      );

      // Still editing this zone; selection didn't drop it — nothing to commit
      if (selectedIds.has(editingId)) return;
      const draw = drawRef.current;
      if (!draw) {
        editingZoneIdRef.current = null;
        return;
      }

      // Get latest geometry from Draw for the zone we were editing
      const all = draw.getAll();
      const updated = all.features.find(
        (f) =>
          f.id === editingId ||
          (f.properties as { zoneId?: string })?.zoneId === editingId,
      );
      if (updated?.geometry && updated.geometry.type === 'Polygon') {
        const geometry = updated.geometry as GeoJSON.Polygon;
        const { areaSqKm, vertexCount } = geometryToZoneProps(geometry);
        // Persist final geometry and derived props to state
        setZones((prev) =>
          prev.map((z) =>
            z.id === editingId ? { ...z, geometry, areaSqKm, vertexCount } : z,
          ),
        );
      }

      // Remove feature from Draw so the app layer owns it; exit direct_select
      draw.delete([editingId]);
      draw.changeMode('simple_select');
      editingZoneIdRef.current = null;
    },
    [],
  );

  const handleDeleteZone = useCallback(
    (zoneId: string) => {
      if (zoneId === selectedZoneId) {
        setSelectedZoneId(null);
      }
      if (zoneId === editingZoneIdRef.current) {
        drawRef.current?.delete([zoneId]);
        drawRef.current?.changeMode('simple_select');
        editingZoneIdRef.current = null;
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
          style={MAPBOX_STANDARD_SATELLITE_STYLE}
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
            onEnterEditMode={handleEnterEditMode}
          />
          <ZoneEditorDrawBridge
            onDrawReady={handleDrawReady}
            onDrawCreate={handleDrawCreate}
            onDrawUpdate={handleDrawUpdate}
            onDrawSelectionChange={handleDrawSelectionChange}
          />
        </MapProvider>
      </div>
    </div>
  );
}
