/**
 * John Hancock Tower (200 Clarendon Street)
 * 200 Clarendon St, Boston, MA 02116
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { AirspaceZone } from '../lib/mapbox/types/AirspaceZone';
import type { Pole } from '../lib/mapbox/types/Pole';
import type { Waypoint } from '../lib/mapbox/types/Waypoint';

const center: [number, number] = [-71.07512263099572, 42.34942291272112];

/**
 * 1 zone around Copley Square
 */
const zones: AirspaceZone[] = [
  {
    id: 'zone-1-mission',
    name: 'Zone 1: Copley Square (Mission)',
    type: 'mission',
    color: '#3b82f6',
    opacity: 0.55,
    ceilingHeightM: 20,
    footprint: [
      { lng: -71.0772, lat: 42.35, floorMetersAgl: 0 },
      { lng: -71.0761, lat: 42.3504, floorMetersAgl: 0 },
      { lng: -71.0758, lat: 42.3497, floorMetersAgl: 0 },
      { lng: -71.0769, lat: 42.3495, floorMetersAgl: 0 },
      { lng: -71.0772, lat: 42.35, floorMetersAgl: 0 },
    ],
  },
];

/**
 * 5 poles near John Hancock Tower
 */
const poles: Pole[] = [
  {
    id: '1000',
    label: 'Pole 1000',
    lng: -71.0758,
    lat: 42.3495,
    baseMetersAgl: 0,
    topMetersAgl: 10,
    status: 'nominal',
  },
  {
    id: '1001',
    label: 'Pole 1001',
    lng: -71.0749,
    lat: 42.3497,
    baseMetersAgl: 0,
    topMetersAgl: 25,
    status: 'flagged',
  },
  {
    id: '1002',
    label: 'Pole 1002',
    lng: -71.0745,
    lat: 42.349,
    baseMetersAgl: 0,
    topMetersAgl: 35,
    status: 'inspected',
  },
  {
    id: '1003',
    label: 'Pole 1003',
    lng: -71.0754,
    lat: 42.3488,
    baseMetersAgl: 0,
    topMetersAgl: 30,
    status: 'nominal',
  },
  {
    id: '1004',
    label: 'Pole 1004',
    lng: -71.0752,
    lat: 42.3493,
    baseMetersAgl: 200,
    topMetersAgl: 260,
    status: 'nominal',
  },
];

const route: Waypoint[] = [
  {
    sequence: 1,
    label: 'W1',
    lng: -71.0755,
    lat: 42.3491,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 2,
    label: 'W2',
    lng: -71.0757,
    lat: 42.3491,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 3,
    label: 'W3',
    lng: -71.0755,
    lat: 42.3486,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 4,
    label: 'W4',
    lng: -71.0763,
    lat: 42.3484,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 5,
    label: 'W5',
    lng: -71.0762,
    lat: 42.3482,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 6,
    label: 'W6',
    lng: -71.0758,
    lat: 42.3473,
    altitudeMetersAgl: 0,
  },
];

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
  route: route,
};
