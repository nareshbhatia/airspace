import type { LngLat } from '../../../lib/mapbox';

export interface Airport {
  id: string;
  name: string;
  coordinates: LngLat;
}

export const airports: Airport[] = [
  {
    id: 'BAH',
    name: 'Bahrain International Airport',
    coordinates: { lng: 50.633889, lat: 26.270833 },
  },
  {
    id: 'BOS',
    name: 'Boston Logan Airport',
    coordinates: { lng: -71.011487, lat: 42.356007 },
  },
  {
    id: 'DXB',
    name: 'Dubai International Airport',
    coordinates: { lng: 55.3644, lat: 25.2528 },
  },
  {
    id: 'HND',
    name: 'Tokyo Haneda Airport',
    coordinates: { lng: 139.7798, lat: 35.5494 },
  },
  {
    id: 'JFK',
    name: 'John F. Kennedy International Airport',
    coordinates: { lng: -73.7787, lat: 40.6399 },
  },
  {
    id: 'LAX',
    name: 'Los Angeles International Airport',
    coordinates: { lng: -118.408, lat: 33.9425 },
  },
  {
    id: 'LHR',
    name: 'London Heathrow Airport',
    coordinates: { lng: -0.454295, lat: 51.47002 },
  },
  {
    id: 'ORD',
    name: "Chicago O'Hare International Airport",
    coordinates: { lng: -87.90784, lat: 41.97728 },
  },
  {
    id: 'SFO',
    name: 'San Francisco International Airport',
    coordinates: { lng: -122.3789, lat: 37.6213 },
  },
];

export const airportById = new Map<string, Airport>(
  airports.map((airport) => [airport.id, airport]),
);
