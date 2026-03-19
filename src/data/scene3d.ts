/**
 * Sample data for the Mapbox 3D Scene page: map center, view config,
 * airspace zones, utility poles, and waypoints. John Hancock Tower area, Boston.
 */

import type { AirspaceZone } from '../lib/mapbox/types/AirspaceZone';
import type { UtilityPole } from '../lib/mapbox/types/UtilityPole';
import type { Waypoint } from '../lib/mapbox/types/Waypoint';

/** John Hancock Tower, Boston (200 Clarendon Street). [lng, lat]. */
export const MAP_CENTER: [number, number] = [-71.0752, 42.3496];

/** Initial map view for the 3D scene page. */
export const MAP_VIEW = {
  zoom: 17,
  pitch: 55,
  bearing: -20,
} as const;

/**
 * Three airspace zones, one block each on streets around John Hancock Tower
 * (Boston): Clarendon St, Trinity Place, Stuart St. Heights per README spec.
 */
export const airspaceZones: AirspaceZone[] = [
  {
    id: 'restricted-clarendon',
    name: 'Restricted Zone (Clarendon St)',
    type: 'restricted',
    color: '#f97316',
    opacity: 0.55,
    floorAltM: 0,
    ceilingAltM: 150,
    footprint: [
      [-71.07532, 42.3491],
      [-71.07508, 42.3491],
      [-71.07508, 42.3499],
      [-71.07532, 42.3499],
      [-71.07532, 42.3491],
    ],
  },
  {
    id: 'advisory-trinity',
    name: 'Advisory Zone (Trinity Place)',
    type: 'advisory',
    color: '#22c55e',
    opacity: 0.55,
    floorAltM: 50,
    ceilingAltM: 200,
    footprint: [
      [-71.0747, 42.3489],
      [-71.0743, 42.3489],
      [-71.0743, 42.3492],
      [-71.0747, 42.3492],
      [-71.0747, 42.3489],
    ],
  },
  {
    id: 'mission-stuart',
    name: 'Mission Boundary (Stuart St)',
    type: 'mission',
    color: '#3b82f6',
    opacity: 0.55,
    floorAltM: 0,
    ceilingAltM: 120,
    footprint: [
      [-71.0761, 42.3482],
      [-71.0743, 42.3482],
      [-71.0743, 42.34835],
      [-71.0761, 42.34835],
      [-71.0761, 42.3482],
    ],
  },
];

/**
 * Five utility poles near John Hancock Tower for the 3D scene. Heights use
 * inspection altitude; color by status (nominal=green, flagged=red, inspected=grey).
 */
export const utilityPoles: UtilityPole[] = [
  {
    id: 'p01547',
    label: 'Pole 01547',
    lng: -71.0755,
    lat: 42.3498,
    inspectionAltM: 10,
    status: 'nominal',
  },
  {
    id: 'p01561',
    label: 'Pole 01561',
    lng: -71.0749,
    lat: 42.3495,
    inspectionAltM: 25,
    status: 'flagged',
  },
  {
    id: 'p01562',
    label: 'Pole 01562',
    lng: -71.0758,
    lat: 42.3489,
    inspectionAltM: 30,
    status: 'nominal',
  },
  {
    id: 'p01563',
    label: 'Pole 01563',
    lng: -71.0745,
    lat: 42.349,
    inspectionAltM: 35,
    status: 'inspected',
  },
  {
    id: 'p01564',
    label: 'Pole 01564',
    lng: -71.076,
    lat: 42.3494,
    inspectionAltM: 40,
    status: 'nominal',
  },
];

/**
 * Inspection route connecting the utility poles in sequence (1–5). Used for
 * the route line and waypoint markers on the 3D scene page.
 */
export const inspectionRoute: Waypoint[] = utilityPoles.map((pole, index) => ({
  sequence: index + 1,
  lng: pole.lng,
  lat: pole.lat,
  altM: pole.inspectionAltM,
  label: String(index + 1),
}));
