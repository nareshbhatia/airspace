export interface AirspaceRoute {
  name: string;

  // [lng, lat, altitude-agl-meters]
  coordinates: [number, number, number][];
}
