/**
 * Valentine Municipal Airport, Nebraska
 * 500 S. Hall Street, Valentine, NE 69201
 */

import type { AirspaceScene } from '../lib/mapbox/types/AirspaceScene';
import type { AirspaceZone } from '../lib/mapbox/types/AirspaceZone';
import type { Pole } from '../lib/mapbox/types/Pole';
import type { Waypoint } from '../lib/mapbox/types/Waypoint';

const center: [number, number] = [-100.54903712945027, 42.86124669982457];

/** North–south step in degrees (~6.7 m); used to derive an east–west step at this latitude. */
const POLE_STEP_DEG_NS = 0.00006;

/** Step east along the parallel (~same ground spacing as POLE_STEP_DEG_NS north). */
const POLE_STEP_DEG_LNG =
  POLE_STEP_DEG_NS / Math.cos((center[1] * Math.PI) / 180);

/**
 * 1 zone around the airport
 */
const zones: AirspaceZone[] = [
  {
    id: 'zone-1-mission',
    name: 'Zone 1: Valentine Municipal Airport (Mission)',
    type: 'mission',
    color: '#3b82f6',
    opacity: 0.55,
    ceilingHeightM: 30,
    footprint: [
      { lng: -100.5498, lat: 42.8607, floorMetersAgl: 0 },
      { lng: -100.5491, lat: 42.8602, floorMetersAgl: 0 },
      { lng: -100.548, lat: 42.8613, floorMetersAgl: 0 },
      { lng: -100.5486, lat: 42.8616, floorMetersAgl: 0 },
      { lng: -100.5498, lat: 42.8607, floorMetersAgl: 0 },
    ],
  },
];

/**
 * Five poles going east from the map center
 */
const poles: Pole[] = [
  {
    id: '1000',
    label: 'Pole 1000',
    lng: center[0],
    lat: center[1],
    baseMetersAgl: 0,
    topMetersAgl: 2,
    status: 'nominal',
  },
  {
    id: '1001',
    label: 'Pole 1001',
    lng: center[0] + POLE_STEP_DEG_LNG,
    lat: center[1],
    baseMetersAgl: 0,
    topMetersAgl: 5,
    status: 'inspected',
  },
  {
    id: '1002',
    label: 'Pole 1002',
    lng: center[0] + 2 * POLE_STEP_DEG_LNG,
    lat: center[1],
    baseMetersAgl: 0,
    topMetersAgl: 10,
    status: 'nominal',
  },
  {
    id: '1003',
    label: 'Pole 1003',
    lng: center[0] + 3 * POLE_STEP_DEG_LNG,
    lat: center[1],
    baseMetersAgl: 0,
    topMetersAgl: 20,
    status: 'flagged',
  },
  {
    id: '1004',
    label: 'Pole 1004',
    lng: center[0] + 4 * POLE_STEP_DEG_LNG,
    lat: center[1],
    baseMetersAgl: 0,
    topMetersAgl: 30,
    status: 'nominal',
  },
];

const route: Waypoint[] = [
  { sequence: 1, label: 'W1', lng: -100.5479, lat: 42.8613, altM: 0 },
  { sequence: 2, label: 'W2', lng: -100.5473, lat: 42.8609, altM: 0 },
  { sequence: 3, label: 'W3', lng: -100.5483, lat: 42.8599, altM: 0 },
  { sequence: 4, label: 'W4', lng: -100.5494, lat: 42.8589, altM: 0 },
  { sequence: 5, label: 'W5', lng: -100.5552, lat: 42.853, altM: 0 },
];

export const scene: AirspaceScene = {
  name: 'Valentine, NE',
  mapProvider: {
    center,
    zoom: 17,
    pitch: 60,
    bearing: 0,
  },
  zones,
  poles,
  route,
};
