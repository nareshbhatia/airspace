import { POLE_RADIUS_M, POLE_STATUS_COLORS } from '../types/Pole';

import type { AirspaceZone } from '../types/AirspaceZone';
import type { Pole } from '../types/Pole';
import type { Waypoint } from '../types/Waypoint';
import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Layer id prefix for airspace zone volumes. One layer per zone so each can
 * have its own opacity (fill-extrusion-opacity is not data-driven in Mapbox).
 * Use this prefix to toggle all zone layers (e.g. in a layer visibility panel).
 */
export const AIRSPACE_ZONE_LAYER_ID_PREFIX = 'airspace-zone-volumes-';

/** Layer ID for the 3D buildings fill-extrusion layer (composite source). */
export const BUILDINGS_LAYER_ID = '3d-buildings';

/** Layer ID for pole fill-extrusion markers. */
export const POLE_MARKERS_LAYER_ID = 'pole-markers';

/** Layer ID for pole label symbols. */
export const POLE_LABELS_LAYER_ID = 'pole-labels';

/** Layer ID for the route line casing. */
export const ROUTE_CASING_LAYER_ID = 'route-casing';

/** Layer ID for the route line. */
export const ROUTE_LINE_LAYER_ID = 'route-line';

/** Layer ID for waypoint symbol markers on the route. */
export const WAYPOINT_MARKERS_LAYER_ID = 'waypoint-markers';

/**
 * Sets a layer's visibility. Safe to call for missing layers (no-op).
 */
export function toggleLayer(
  map: MapboxMap,
  layerId: string,
  visible: boolean,
): void {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

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
 * Used for cylindrical fill-extrusions (e.g. poles). More segments
 * yield a smoother cylinder.
 */
export function pointToCirclePolygon(
  lng: number,
  lat: number,
  radiusMeters = POLE_RADIUS_M,
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
 * source. Building footprints, heights, and coordinates come from Mapbox’s
 * composite tiles (OSM-derived); this layer only references that source.
 * Inserts the layer below the first symbol layer so labels and POIs render on
 * top. OSM building data is only present at zoom 14+.
 */
export function addBuildings(map: MapboxMap): void {
  if (map.getLayer(BUILDINGS_LAYER_ID)) return;

  const layers = map.getStyle().layers;
  const firstSymbolLayer = layers?.find(
    (l) =>
      l.type === 'symbol' &&
      (l.layout as Record<string, unknown>)?.['text-field'],
  );

  map.addLayer(
    {
      id: BUILDINGS_LAYER_ID,
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
 * Adds pole markers (fill-extrusion) and labels (symbol) to the map.
 * Each pole is a cylindrical vertical bar with height = poleTopM and
 * color by status. Labels show the pole label at the base.
 */
export function addPoles(map: MapboxMap, poles: Pole[]): void {
  if (map.getLayer(POLE_MARKERS_LAYER_ID)) return;

  if (!map.getSource('poles')) {
    map.addSource('poles', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: poles.map((pole) => ({
          type: 'Feature',
          properties: {
            id: pole.id,
            label: pole.label,
            status: pole.status,
            color: POLE_STATUS_COLORS[pole.status],
            poleTop: pole.poleTopM,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              pointToCirclePolygon(pole.lng, pole.lat, POLE_RADIUS_M),
            ],
          },
        })),
      },
    });
  }

  map.addLayer({
    id: POLE_MARKERS_LAYER_ID,
    type: 'fill-extrusion',
    source: 'poles',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'poleTop'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.9,
    },
  });

  map.addLayer({
    id: POLE_LABELS_LAYER_ID,
    type: 'symbol',
    source: 'poles',
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

/**
 * Registers a single waypoint badge image with the map: a canvas-drawn circle
 * with the sequence number, for use in the waypoint symbol layer.
 */
export function createWaypointImage(map: MapboxMap, sequence: number): void {
  const size = 28;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1d4ed8';
  ctx.font = `bold ${size * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sequence), size / 2, size / 2);

  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage(`waypoint-${sequence}`, imageData);
}

/**
 * Adds the route line (with casing) and waypoint symbol markers to
 * the map. Call after addPoles so the route renders above poles.
 */
export function addRoute(map: MapboxMap, waypoints: Waypoint[]): void {
  if (map.getLayer(ROUTE_LINE_LAYER_ID) || map.getSource('route')) return;
  if (waypoints.length < 2) return;

  const coordinates = waypoints.map(
    (wp) => [wp.lng, wp.lat] as [number, number],
  );

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    },
  });

  map.addLayer({
    id: ROUTE_CASING_LAYER_ID,
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#1d4ed8',
      'line-width': 5,
      'line-opacity': 0.8,
    },
  });

  map.addLayer({
    id: ROUTE_LINE_LAYER_ID,
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 1,
    },
  });

  waypoints.forEach((wp) => createWaypointImage(map, wp.sequence));

  map.addSource('waypoints', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: waypoints.map((wp) => ({
        type: 'Feature' as const,
        properties: { sequence: wp.sequence, label: wp.label },
        geometry: {
          type: 'Point' as const,
          coordinates: [wp.lng, wp.lat],
        },
      })),
    },
  });

  map.addLayer({
    id: WAYPOINT_MARKERS_LAYER_ID,
    type: 'symbol',
    source: 'waypoints',
    layout: {
      'icon-image': ['concat', 'waypoint-', ['get', 'sequence']],
      'icon-size': 1,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
}
