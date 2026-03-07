import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { DroneModel } from './DroneModel';
import { cn } from '../../../utils/cn';

/**
 * 3D Drone page for viewing the drone in a 3D scene.
 */
export function Drone3DPage() {
  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-background text-foreground',
      )}
    >
      <div className="min-h-0 flex-1 w-full">
        <Canvas
          className="h-full w-full"
          camera={{ fov: 75, position: [0, 1000, 1000], far: 5000 }}
        >
          <OrbitControls />
          {/* <gridHelper args={[1000, 20, 0x333333, 0x222222]} /> */}
          {/* <axesHelper args={[300]} /> */}
          <ambientLight color={0xffffff} intensity={0.4} />
          <directionalLight
            color={0xffffff}
            intensity={6}
            position={[-500, 1000, 500]}
          />
          <pointLight
            color="orange"
            intensity={10}
            distance={0}
            decay={0}
            position={[300, 300, 300]}
          />
          <DroneModel />
        </Canvas>
      </div>
    </div>
  );
}
