import { useEffect, useRef } from 'react';

import { useMap } from './useMap';

const PITCH_3D_DEG = 45;

/**
 * - When `is3dEnabled` is false, locks pitch to 0 and disables touch pitch so the
 * user cannot change tilt.
 * - When `is3dEnabled` is true, restores intrinsic min/max pitch (from the
 * map on first run), sets pitch to 45°, and re-enables touch pitch.
 */
export function useMapPitch3dToggle(is3dEnabled: boolean): void {
  const { map } = useMap();

  // Snapshot of min/max pitch before we force 0/0 in 2D mode,
  // so we can restore custom Map limits when 3D is on again.
  const intrinsicRef = useRef<{ min: number; max: number } | null>(null);

  useEffect(() => {
    if (!map) return;

    if (intrinsicRef.current == null) {
      intrinsicRef.current = {
        min: map.getMinPitch(),
        max: map.getMaxPitch(),
      };
    }

    const { min: iMin, max: iMax } = intrinsicRef.current ?? {
      min: 0,
      max: 0,
    };

    if (is3dEnabled) {
      map.setMinPitch(iMin);
      map.setMaxPitch(iMax);
      map.setPitch(PITCH_3D_DEG);
      map.touchPitch.enable();
    } else {
      map.setPitch(0);
      map.setMinPitch(0);
      map.setMaxPitch(0);
      map.touchPitch.disable();
    }
  }, [map, is3dEnabled]);
}
