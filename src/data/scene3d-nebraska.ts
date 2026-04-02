/**
 * Valentine Municipal Airport, Nebraska
 * 500 S. Hall Street, Valentine, NE 69201
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { UtilityPole } from '../lib/mapbox/types/UtilityPole';

const center: [number, number] = [-100.54903712945027, 42.86124669982457];

/** Step north along the meridian (~6.7 m between poles at this latitude). */
const POLE_STEP_DEG_LAT = 0.00006;

/**
 * Five utility poles going north from the map center
 */
const poles: UtilityPole[] = [
  {
    id: '1000',
    label: 'Pole 1000',
    lng: center[0],
    lat: center[1],
    inspectionAltM: 2,
    status: 'nominal',
  },
  {
    id: '1001',
    label: 'Pole 1001',
    lng: center[0],
    lat: center[1] + POLE_STEP_DEG_LAT,
    inspectionAltM: 5,
    status: 'inspected',
  },
  {
    id: '1002',
    label: 'Pole 1002',
    lng: center[0],
    lat: center[1] + 2 * POLE_STEP_DEG_LAT,
    inspectionAltM: 10,
    status: 'nominal',
  },
  {
    id: '1003',
    label: 'Pole 1003',
    lng: center[0],
    lat: center[1] + 3 * POLE_STEP_DEG_LAT,
    inspectionAltM: 20,
    status: 'flagged',
  },
  {
    id: '1004',
    label: 'Pole 1004',
    lng: center[0],
    lat: center[1] + 4 * POLE_STEP_DEG_LAT,
    inspectionAltM: 30,
    status: 'nominal',
  },
];

export const scene: AirspaceScene = {
  name: 'Valentine, NE',
  mapProvider: {
    center,
    zoom: 17,
    pitch: 55,
    bearing: -20,
  },
  zones: [],
  poles,
  inspectionRoute: [],
};
