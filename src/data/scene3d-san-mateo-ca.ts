/**
 * 3000 Clearview Way, San Mateo, CA 94402
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { Pole } from '../lib/mapbox/types/Pole';

const center: [number, number] = [-122.33129971217056, 37.534526705764435];

/**
 * 10 poles in a circle with pole 1000 at the center
 */
const poles: Pole[] = [
  {
    id: '1000',
    label: 'Pole 1000',
    lng: center[0],
    lat: center[1],
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1001',
    label: 'Pole 1001',
    lng: -122.33129971217056,
    lat: 37.535424705764434,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1002',
    label: 'Pole 1002',
    lng: -122.33057192574826,
    lat: 37.535214706021776,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1003',
    label: 'Pole 1003',
    lng: -122.33018409127709,
    lat: 37.53468270636915,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1004',
    label: 'Pole 1004',
    lng: -122.33031911400494,
    lat: 37.53407770623164,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1005',
    label: 'Pole 1005',
    lng: -122.3309118776984,
    lat: 37.53368270583752,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1006',
    label: 'Pole 1006',
    lng: -122.33168754664273,
    lat: 37.53368270583752,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1007',
    label: 'Pole 1007',
    lng: -122.33228031033619,
    lat: 37.53407770623164,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1008',
    label: 'Pole 1008',
    lng: -122.33241533306403,
    lat: 37.53468270636915,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
  {
    id: '1009',
    label: 'Pole 1009',
    lng: -122.33202749859286,
    lat: 37.535214706021776,
    baseMetersAgl: 0,
    topMetersAgl: 50,
    status: 'nominal',
  },
];

export const scene: AirspaceScene = {
  name: 'San Mateo, CA',
  mapProvider: {
    center,
    zoom: 19,
    pitch: 5,
    bearing: 40,
  },
  zones: [],
  poles,
  route: [],
};
