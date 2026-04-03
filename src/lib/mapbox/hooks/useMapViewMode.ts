import { useEffect, useRef } from 'react';

import { useMap } from './useMap';

import type { MapViewMode } from '../types/MapViewMode';

/** Pitch applied in 3D view mode. */
export const MAP_PITCH_3D_DEG = 45;

const VIEW_MODE_EASE_MS = 300;

/**
 * Applies 2D vs 3D to the map view:
 * - tilt limits
 * - touch pitch
 * - camera projection
 * - pitch (via easeTo)
 */
export function useMapViewMode(mode: MapViewMode): void {
  const { map } = useMap();
  const is3d = mode === '3d';

  // Snapshot of min/max pitch before we force 0/0 in 2D mode,
  // so we can restore custom Map limits when 3D is on again.
  const intrinsicRef = useRef<{ min: number; max: number } | null>(null);

  // --- Effect 1 (runs before effect 2 in the same render cycle) ---
  // Touch + pitch *limits* only. Actual pitch is driven by effect 2 (easeTo).
  //
  // 3D: restore intrinsic min/max and enable touch pitch so the user can tilt
  // after we ease up — limits must exist before / with that motion.
  //
  // 2D: disable touch pitch only. Do NOT set min/max pitch to 0 here: that
  // clamps pitch immediately while the camera is still tilted, so the follow-up
  // easeTo in effect 2 cannot animate 3D→2D. Min/max for 2D are applied after
  // the ease finishes (see effect 2 + moveend).
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

    if (is3d) {
      map.setMinPitch(iMin);
      map.setMaxPitch(iMax);
      map.touchPitch.enable();
    } else {
      map.touchPitch.disable();
    }
  }, [map, is3d]);

  // --- Effect 2 ---
  // Projection + easeTo pitch. Runs after effect 1 so 3D limits are in place
  // before we ease to MAP_PITCH_3D_DEG; for 2D we ease to 0 without prior clamp.
  //
  // 2D: after easeTo, lock min/max pitch on moveend. If we set maxPitch(0) in
  // the same synchronous turn as easeTo, pitch snaps to 0 and there is no
  // visible flattening animation. Cleanup removes the listener if the user
  // toggles back to 3D (or unmounts) before moveend fires.
  useEffect(() => {
    if (!map) return;

    map.setCamera({
      'camera-projection': is3d ? 'perspective' : 'orthographic',
    });
    map.easeTo({
      pitch: is3d ? MAP_PITCH_3D_DEG : 0,
      duration: VIEW_MODE_EASE_MS,
    });

    if (is3d) {
      return undefined;
    }

    // Helper function to lock the pitch limits to 0
    const lockFlatPitchLimits = () => {
      map.setMinPitch(0);
      map.setMaxPitch(0);
    };

    // Once the map has moved, lock the pitch limits to 0
    map.once('moveend', lockFlatPitchLimits);

    return () => {
      map.off('moveend', lockFlatPitchLimits);
    };
  }, [map, is3d]);
}
