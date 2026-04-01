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
    id: 'r001',
    label: 'Rural Pole 001',
    lng: center[0],
    lat: center[1],
    inspectionAltM: 2,
    status: 'nominal',
  },
  {
    id: 'r002',
    label: 'Rural Pole 002',
    lng: center[0],
    lat: center[1] + POLE_STEP_DEG_LAT,
    inspectionAltM: 5,
    status: 'inspected',
  },
  {
    id: 'r003',
    label: 'Rural Pole 003',
    lng: center[0],
    lat: center[1] + 2 * POLE_STEP_DEG_LAT,
    inspectionAltM: 10,
    status: 'nominal',
  },
  {
    id: 'r004',
    label: 'Rural Pole 004',
    lng: center[0],
    lat: center[1] + 3 * POLE_STEP_DEG_LAT,
    inspectionAltM: 20,
    status: 'flagged',
  },
  {
    id: 'r005',
    label: 'Rural Pole 005',
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
