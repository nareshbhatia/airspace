export interface AirspaceZone {
  id: string;
  name: string;
  type: 'restricted' | 'advisory' | 'mission';
  color: string;
  opacity: number;
  floorAltM: number;
  ceilingAltM: number;
  footprint: [number, number][];
}
