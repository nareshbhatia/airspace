/**
 * 3328 Laporte Avenue, Fort Collins, CO 80521
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { AirspaceZone } from '../lib/mapbox/types/AirspaceZone';
import type { Pole } from '../lib/mapbox/types/Pole';
import type { Waypoint } from '../lib/mapbox/types/Waypoint';

const center: [number, number] = [-105.1400063, 40.5908333];

/**
 * 4 zones around Fort Collins
 */
const zones: AirspaceZone[] = [
  {
    id: 'zone-1-restricted',
    name: 'Zone 1: Mountains (Restricted)',
    type: 'restricted',
    color: '#f97316',
    opacity: 0.55,
    ceilingHeightM: 160,
    footprint: [
      { lng: -105.2019, lat: 40.5818, floorMetersAgl: 0 },
      { lng: -105.1957, lat: 40.5811, floorMetersAgl: 0 },
      { lng: -105.1961, lat: 40.5783, floorMetersAgl: 0 },
      { lng: -105.2021, lat: 40.5789, floorMetersAgl: 0 },
      { lng: -105.2019, lat: 40.5818, floorMetersAgl: 0 },
    ],
  },
  {
    id: 'zone-2-advisory',
    name: 'Zone 2: Horsetooth Reservoir (Advisory)',
    type: 'advisory',
    color: '#22c55e',
    opacity: 0.55,
    ceilingHeightM: 160,
    footprint: [
      { lng: -105.1797, lat: 40.5834, floorMetersAgl: 0 },
      { lng: -105.1714, lat: 40.5851, floorMetersAgl: 0 },
      { lng: -105.1702, lat: 40.5816, floorMetersAgl: 0 },
      { lng: -105.1785, lat: 40.5798, floorMetersAgl: 0 },
      { lng: -105.1797, lat: 40.5834, floorMetersAgl: 0 },
    ],
  },
  {
    id: 'zone-3-mission',
    name: 'Zone 3: Airport (Mission)',
    type: 'mission',
    color: '#3b82f6',
    opacity: 0.55,
    ceilingHeightM: 20,
    footprint: [
      { lng: -105.1404, lat: 40.5909, floorMetersAgl: 0 },
      { lng: -105.1398, lat: 40.5911, floorMetersAgl: 0 },
      { lng: -105.1396, lat: 40.5908, floorMetersAgl: 0 },
      { lng: -105.1402, lat: 40.5905, floorMetersAgl: 0 },
      { lng: -105.1404, lat: 40.5909, floorMetersAgl: 0 },
    ],
  },
  {
    id: 'zone-4-mission',
    name: 'Zone 4: Solar Farm (Mission)',
    type: 'mission',
    color: '#3b82f6',
    opacity: 0.55,
    ceilingHeightM: 20,
    footprint: [
      { lng: -105.1501, lat: 40.5938, floorMetersAgl: 0 },
      { lng: -105.1448, lat: 40.5939, floorMetersAgl: 100 },
      { lng: -105.1448, lat: 40.5902, floorMetersAgl: 0 },
      { lng: -105.1466, lat: 40.5902, floorMetersAgl: 0 },
      { lng: -105.1501, lat: 40.5922, floorMetersAgl: 0 },
      { lng: -105.1501, lat: 40.5938, floorMetersAgl: 0 },
    ],
  },
];

/**
 * 10 poles in a circle with pole 1000 at the center
 */
const poles: Pole[] = [
  {
    id: '1000',
    label: 'Pole 1000',
    lng: -105.1400063,
    lat: 40.5908333,
    baseMetersAgl: 10,
    topMetersAgl: 60,
    status: 'nominal',
  },
  {
    id: '1001',
    label: 'Pole 1001',
    lng: -105.1400063,
    lat: 40.5917313,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1002',
    label: 'Pole 1002',
    lng: -105.1392463,
    lat: 40.5915213,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1003',
    label: 'Pole 1003',
    lng: -105.1388413,
    lat: 40.5909893,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1004',
    label: 'Pole 1004',
    lng: -105.1389823,
    lat: 40.5903843,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1005',
    label: 'Pole 1005',
    lng: -105.1396013,
    lat: 40.5899893,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1006',
    label: 'Pole 1006',
    lng: -105.1404113,
    lat: 40.5899893,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1007',
    label: 'Pole 1007',
    lng: -105.1410303,
    lat: 40.5903843,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1008',
    label: 'Pole 1008',
    lng: -105.1411713,
    lat: 40.5909893,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1009',
    label: 'Pole 1009',
    lng: -105.1407663,
    lat: 40.5915213,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
];

const route: Waypoint[] = [
  {
    sequence: 1,
    label: 'W1',
    lng: -105.1494,
    lat: 40.5427,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 2,
    label: 'W2',
    lng: -105.1491,
    lat: 40.5431,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 3,
    label: 'W3',
    lng: -105.1492,
    lat: 40.5434,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 4,
    label: 'W4',
    lng: -105.149,
    lat: 40.5445,
    altitudeMetersAgl: 100,
  },
  {
    sequence: 5,
    label: 'W5',
    lng: -105.1482,
    lat: 40.5434,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 6,
    label: 'W6',
    lng: -105.1482,
    lat: 40.5429,
    altitudeMetersAgl: 0,
  },
  {
    sequence: 7,
    label: 'W7',
    lng: -105.1472,
    lat: 40.5441,
    altitudeMetersAgl: 100,
  },
  {
    sequence: 8,
    label: 'W8',
    lng: -105.1469,
    lat: 40.5441,
    altitudeMetersAgl: 0,
  },
];

export const scene: AirspaceScene = {
  name: 'Fort Collins, CO',
  mapProvider: {
    center,
    zoom: 18,
    pitch: 60,
    bearing: 0,
  },
  zones,
  poles,
  route,
};
