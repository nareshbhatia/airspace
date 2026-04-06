import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { buildThreejsScene, lngLatLikeToTuple } from './buildThreejsScene';
import { DEFAULT_SCENE, scenes } from '../../../data/scenes';
import { MapPanel } from '../../../lib/mapbox/components/MapPanel';
import { SceneSelector } from '../../../lib/mapbox/components/SceneSelector';
import { cn } from '../../../utils/cn';

import type { ThreejsSceneApi } from './buildThreejsScene';
import type { AirspaceScene } from '../../../lib/mapbox/types/AirspaceScene';

function fallbackCenterLngLat(scene: AirspaceScene): [number, number] {
  const p = scene.zones[0]?.footprint[0];
  if (p) {
    return [p.lng, p.lat];
  }
  return [0, 0];
}

/**
 * Three.js concepts: raw WebGL viewport with airspace zones for the selected scene.
 */
export function ThreejsConceptsPage() {
  const [scene, setScene] = useState<AirspaceScene>(DEFAULT_SCENE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threejsSceneApiRef = useRef<ThreejsSceneApi | undefined>(undefined);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const threejsSceneApi = buildThreejsScene(canvas);

    threejsSceneApiRef.current = threejsSceneApi;
    return () => {
      threejsSceneApi.dispose();
      threejsSceneApiRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const screenApi = threejsSceneApiRef.current;
    if (!screenApi) {
      return;
    }
    const centerLike = scene.mapProvider.center;
    const center: [number, number] =
      centerLike != null
        ? lngLatLikeToTuple(centerLike)
        : fallbackCenterLngLat(scene);
    screenApi.setSceneAndCenter(scene.zones, scene.poles, scene.route, center);
  }, [scene]);

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <div className="absolute right-3 top-3 z-10 flex min-w-40 flex-col gap-2">
        <MapPanel>
          <SceneSelector
            scenes={scenes}
            selectedScene={scene}
            onSceneChange={setScene}
          />
        </MapPanel>
      </div>
      <canvas
        ref={canvasRef}
        className={cn('block h-full min-h-0 w-full flex-1')}
      />
    </div>
  );
}
