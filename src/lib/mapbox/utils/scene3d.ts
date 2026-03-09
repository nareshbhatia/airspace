import { UTILITY_POLE_STATUS_COLORS } from '../types/UtilityPole';

import type { AirspaceZone } from '../types/AirspaceZone';
import type { UtilityPole } from '../types/UtilityPole';
import type { Map as MapboxMap } from 'mapbox-gl';

export const AIRSPACE_ZONE_LAYER_ID_PREFIX = 'airspace-zone-volumes-';

/**
 * Returns a closed polygon ring (five [lng, lat] points) for a square centered
 * on the given point. Used to create small fill-extrusion footprints from
 * point data.
 */
export function pointToSquarePolygon(
  lng: number,
  lat: number,
  widthMeters = 4,
): [number, number][] {
  const dLat = widthMeters / 111_320;
  const dLng = widthMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ];
}

/**
 * Returns a closed polygon ring approximating a circle centered on the point.
 * Used for cylindrical fill-extrusions (e.g. utility poles). More segments
 * yield a smoother cylinder.
 */
export function pointToCirclePolygon(
  lng: number,
  lat: number,
  radiusMeters = 2,
  segments = 16,
): [number, number][] {
  const dLatPerM = 1 / 111_320;
  const dLngPerM = 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle) * dLngPerM;
    const dy = radiusMeters * Math.sin(angle) * dLatPerM;
    ring.push([lng + dx, lat + dy]);
  }
  return ring;
}

/**
 * Adds airspace zone volumes as a fill-extrusion layer. Zones are translucent
 * boxes with floor/ceiling altitude from data.
 *
 * @param beforeLayerId - If set, the layer is inserted before this id (zones
 * behind that layer). If omitted, the layer is added on top so zones are visible.
 */
/**
 * Layer id prefix for airspace zone volumes. One layer per zone so each can
 * have its own opacity (fill-extrusion-opacity is not data-driven in Mapbox).
 * Use this prefix to toggle all zone layers (e.g. in a layer visibility panel).
 */
export function addAirspaceZones(
  map: MapboxMap,
  zones: AirspaceZone[],
  beforeLayerId?: string,
): void {
  const firstLayerId = `${AIRSPACE_ZONE_LAYER_ID_PREFIX}${zones[0]?.id ?? ''}`;
  if (zones.length === 0 || map.getLayer(firstLayerId)) return;

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

  const layerOptions = (
    zone: AirspaceZone,
  ): Parameters<MapboxMap['addLayer']>[0] => ({
    id: `${AIRSPACE_ZONE_LAYER_ID_PREFIX}${zone.id}`,
    type: 'fill-extrusion',
    source: 'airspace-zones',
    filter: ['==', ['get', 'id'], zone.id],
    paint: {
      'fill-extrusion-color': zone.color,
      'fill-extrusion-base': zone.floorAltM,
      'fill-extrusion-height': zone.ceilingAltM,
      'fill-extrusion-opacity': zone.opacity,
    },
  });

  for (let i = 0; i < zones.length; i++) {
    const layer = layerOptions(zones[i]);
    if (beforeLayerId !== undefined && map.getLayer(beforeLayerId)) {
      map.addLayer(layer, beforeLayerId);
    } else {
      map.addLayer(layer);
    }
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

/**
 * Adds utility pole markers (fill-extrusion) and labels (symbol) to the map.
 * Each pole is a cylindrical vertical bar with height = inspectionAltM and
 * color by status. Labels show the pole label at the base.
 */
export function addUtilityPoles(map: MapboxMap, poles: UtilityPole[]): void {
  if (map.getLayer('utility-pole-markers')) return;

  map.addSource('utility-poles', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: poles.map((pole) => ({
        type: 'Feature',
        properties: {
          id: pole.id,
          label: pole.label,
          status: pole.status,
          color: UTILITY_POLE_STATUS_COLORS[pole.status],
          inspectionAlt: pole.inspectionAltM,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [pointToCirclePolygon(pole.lng, pole.lat)],
        },
      })),
    },
  });

  map.addLayer({
    id: 'utility-pole-markers',
    type: 'fill-extrusion',
    source: 'utility-poles',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'inspectionAlt'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.9,
    },
  });

  map.addLayer({
    id: 'utility-pole-labels',
    type: 'symbol',
    source: 'utility-poles',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 11,
      'text-anchor': 'top',
      'text-offset': [0, 0.5],
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1,
    },
  });
}
