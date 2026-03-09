export interface UtilityPole {
  id: string;
  label: string;
  lng: number;
  lat: number;
  heightM: number;
  inspectionAltM: number;
  status: 'nominal' | 'flagged' | 'inspected';
}

export const UTILITY_POLE_STATUS_COLORS: Record<UtilityPole['status'], string> =
  {
    nominal: '#22c55e',
    flagged: '#ef4444',
    inspected: '#64748b',
  };
