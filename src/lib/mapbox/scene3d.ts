import type { AirspaceZone } from './types/AirspaceZone';
import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Adds airspace zone volumes as a fill-extrusion layer. Zones are translucent
 * boxes with floor/ceiling altitude from data.
 *
 * @param beforeLayerId - If set, the layer is inserted before this id (zones
 * behind that layer). If omitted, the layer is added on top so zones are visible.
 */
export function addAirspaceZones(
  map: MapboxMap,
  zones: AirspaceZone[],
  beforeLayerId?: string,
): void {
  if (map.getLayer('airspace-zone-volumes')) return;

  if (!map.getSource('airspace-zones')) {
    map.addSource('airspace-zones', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: zones.map((zone) => ({
          type: 'Feature',
          properties: {
            id: zone.id,
            name: zone.name,
            type: zone.type,
            color: zone.color,
            opacity: zone.opacity,
            floor: zone.floorAltM,
            ceiling: zone.ceilingAltM,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [zone.footprint],
          },
        })),
      },
    });
  }

  const layer = {
    id: 'airspace-zone-volumes',
    type: 'fill-extrusion' as const,
    source: 'airspace-zones',
    paint: {
      'fill-extrusion-color': ['get', 'color'] as [string, string],
      'fill-extrusion-base': ['get', 'floor'] as [string, string],
      'fill-extrusion-height': ['get', 'ceiling'] as [string, string],
      'fill-extrusion-opacity': 0.55,
    },
  };

  if (beforeLayerId !== undefined && map.getLayer(beforeLayerId)) {
    map.addLayer(layer as Parameters<MapboxMap['addLayer']>[0], beforeLayerId);
  } else {
    map.addLayer(layer as Parameters<MapboxMap['addLayer']>[0]);
  }
}

/**
 * Adds the 3D buildings fill-extrusion layer to the map using the composite
 * source. Inserts the layer below the first symbol layer so labels and POIs
 * render on top. OSM building data is only present at zoom 14+.
 */
export function addBuildings(map: MapboxMap): void {
  if (map.getLayer('3d-buildings')) return;

  const layers = map.getStyle().layers;
  const firstSymbolLayer = layers?.find(
    (l) =>
      l.type === 'symbol' &&
      (l.layout as Record<string, unknown>)?.['text-field'],
  );

  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', ['get', 'extrude'], 'true'],
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#2a2a3e',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.75,
        'fill-extrusion-ambient-occlusion-intensity': 0.4,
        'fill-extrusion-ambient-occlusion-radius': 3,
      },
    },
    firstSymbolLayer?.id,
  );
}
