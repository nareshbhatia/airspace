/**
 * Sample data for the Mapbox 3D Scene page: map center, view config,
 * airspace zones, utility poles, and waypoints. John Hancock Tower area, Boston.
 */

import type { AirspaceZone } from '../lib/mapbox/types/AirspaceZone';

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
