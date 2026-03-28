/**
 * Sample data for a rural 3D scene with sparse buildings and utility poles.
 */

import type { UtilityPole } from '../lib/mapbox/types/UtilityPole';

/** Rural area near Valentine, Nebraska. [lng, lat]. */
export const MAP_CENTER: [number, number] = [-100.5515, 42.8728];

/** Initial map view for the rural scene page. */
export const MAP_VIEW = {
  zoom: 19,
  pitch: 55,
  bearing: -20,
} as const;

/**
 * Five utility poles laid out in a straight line.
 * Heights span from 2m to 30m to test near-clip behavior at different altitudes.
 */
export const utilityPoles: UtilityPole[] = [
  {
    id: 'r001',
    label: 'Rural Pole 001',
    lng: -100.55156,
    lat: 42.8728,
    inspectionAltM: 2,
    status: 'nominal',
  },
  {
    id: 'r002',
    label: 'Rural Pole 002',
    lng: -100.551499,
    lat: 42.8728,
    inspectionAltM: 5,
    status: 'inspected',
  },
  {
    id: 'r003',
    label: 'Rural Pole 003',
    lng: -100.551438,
    lat: 42.8728,
    inspectionAltM: 10,
    status: 'nominal',
  },
  {
    id: 'r004',
    label: 'Rural Pole 004',
    lng: -100.551377,
    lat: 42.8728,
    inspectionAltM: 20,
    status: 'flagged',
  },
  {
    id: 'r005',
    label: 'Rural Pole 005',
    lng: -100.551316,
    lat: 42.8728,
    inspectionAltM: 30,
    status: 'nominal',
  },
];
