import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function BodyMaterial() {
  return (
    <meshStandardMaterial color={0x282828} metalness={0.7} roughness={0.3} />
  );
}

function RotorMaterial() {
  return (
    <meshStandardMaterial color={0x2196f3} metalness={0.7} roughness={0.5} />
  );
}

/**
 * Drone model: two plates, four rotors, and four arms
 * Built declaratively with R3F primitives
 */
export function DroneModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // state.clock.elapsedTime is total time since scene started
    const t = state.clock.elapsedTime;

    // Hover using gentle sinusoidal Y oscillation
    // time = t, frequency = 1.5, amplitude = 20
    groupRef.current.position.y = Math.sin(t * 1.5) * 20;

    // Slow yaw rotation
    // delta is seconds since last frame — use it for frame-rate-independent motion
    groupRef.current.rotation.y += delta * 0.3;
  });

  return (
    <group ref={groupRef}>
      {/* Plate 1: position.y = 15 = 10 + 5 = half of arm height + half of plate height */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[200, 10, 200]} />
        <BodyMaterial />
      </mesh>

      {/* Plate 2 */}
      <mesh position={[0, -15, 0]}>
        <boxGeometry args={[200, 10, 200]} />
        <BodyMaterial />
      </mesh>

      {/* Rotor 1; position.y = 20 = 10 + 10 (half of arm height + half of rotor height) */}
      <mesh position={[-275, 20, -275]}>
        <cylinderGeometry args={[75, 75, 20]} />
        <RotorMaterial />
      </mesh>

      {/* Rotor 2 */}
      <mesh position={[275, 20, -275]}>
        <cylinderGeometry args={[75, 75, 20]} />
        <RotorMaterial />
      </mesh>

      {/* Rotor 3 */}
      <mesh position={[-275, 20, 275]}>
        <cylinderGeometry args={[75, 75, 20]} />
        <RotorMaterial />
      </mesh>

      {/* Rotor 4 */}
      <mesh position={[275, 20, 275]}>
        <cylinderGeometry args={[75, 75, 20]} />
        <RotorMaterial />
      </mesh>

      {/*
        Arms 1:
        By default it is created with its axis in Y direction, so vertically.
        We rotate it to be horizontal and diagonal.
        We first rotate it by 90 degrees on the X axis to make it horizontal,
        then by -45 degrees on the Z axis to make it diagonal.
      */}
      <mesh
        position={[-175, 0, -175]}
        rotation={[Math.PI / 2, 0, -Math.PI / 4]}
      >
        <cylinderGeometry args={[10, 10, 290]} />
        <BodyMaterial />
      </mesh>

      {/* Arms 2 */}
      <mesh position={[175, 0, -175]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <cylinderGeometry args={[10, 10, 290]} />
        <BodyMaterial />
      </mesh>

      {/* Arms 3 */}
      <mesh position={[175, 0, 175]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[10, 10, 290]} />
        <BodyMaterial />
      </mesh>

      {/* Arms 4 */}
      <mesh position={[-175, 0, 175]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <cylinderGeometry args={[10, 10, 290]} />
        <BodyMaterial />
      </mesh>
    </group>
  );
}
