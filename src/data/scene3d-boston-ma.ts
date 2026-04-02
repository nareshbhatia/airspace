/**
 * John Hancock Tower (200 Clarendon Street)
 * 200 Clarendon St, Boston, MA 02116
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { AirspaceZone } from '../lib/mapbox/types/AirspaceZone';
import type { UtilityPole } from '../lib/mapbox/types/UtilityPole';
import type { Waypoint } from '../lib/mapbox/types/Waypoint';

const center: [number, number] = [-71.07512263099572, 42.34942291272112];

/**
 * Three zones around John Hancock Tower
 */
const zones: AirspaceZone[] = [
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
 * 5 utility poles near John Hancock Tower
 */
const poles: UtilityPole[] = [
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

const inspectionRoute: Waypoint[] = poles.map((pole, index) => ({
  sequence: index + 1,
  lng: pole.lng,
  lat: pole.lat,
  altM: pole.inspectionAltM,
  label: String(index + 1),
}));

export const scene: AirspaceScene = {
  name: 'Boston, MA',
  mapProvider: {
    center,
    zoom: 18,
    pitch: 55,
    bearing: 0,
  },
  zones,
  poles,
  inspectionRoute,
};
