export interface Pole {
  id: string;
  label: string;
  lng: number;
  lat: number;
  /** Pole top (m AGL). The 3D bar is drawn from 0 → this value. */
  poleTopM: number;
  status: 'nominal' | 'flagged' | 'inspected';
}

/** Pole radius in meters (used for cylindrical footprints/meshes). */
export const POLE_RADIUS_M = 2.0;

export const POLE_STATUS_COLORS: Record<Pole['status'], string> = {
  nominal: '#22c55e',
  flagged: '#ef4444',
  inspected: '#64748b',
};
