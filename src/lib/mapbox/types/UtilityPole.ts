export interface UtilityPole {
  id: string;
  label: string;
  lng: number;
  lat: number;
  /** Drone inspection altitude (m AGL). The 3D bar is drawn from 0 → this value. */
  inspectionAltM: number;
  status: 'nominal' | 'flagged' | 'inspected';
}

export const UTILITY_POLE_STATUS_COLORS: Record<UtilityPole['status'], string> =
  {
    nominal: '#22c55e',
    flagged: '#ef4444',
    inspected: '#64748b',
  };
