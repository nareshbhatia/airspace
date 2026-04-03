/**
 * 3328 Laporte Avenue, Fort Collins, CO 80521
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { Pole } from '../lib/mapbox/types/Pole';

const center: [number, number] = [-105.1400063, 40.5908333];

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

export const scene: AirspaceScene = {
  name: 'Fort Collins, CO',
  mapProvider: {
    center,
    zoom: 18,
    pitch: 60,
    bearing: 0,
  },
  zones: [],
  poles,
  route: [],
};
