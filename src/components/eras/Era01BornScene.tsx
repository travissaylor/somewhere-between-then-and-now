'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Era01BornSceneProps {
  visible?: boolean;
}

/**
 * Era 01 — Being Born
 *
 * Abstract warm light emerging from darkness.
 * Procedural geometry only — no loaded assets.
 * Feeling: warmth, emergence, the pulse before first breath.
 */
export default function Era01BornScene({ visible = true }: Era01BornSceneProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const blob1Ref = useRef<THREE.Mesh>(null);
  const blob2Ref = useRef<THREE.Mesh>(null);
  const blob3Ref = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Gentle pulse on the core sphere
    if (coreRef.current) {
      const scale = 1.0 + 0.12 * Math.sin(t * 1.2);
      coreRef.current.scale.setScalar(scale);
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 1.2);
    }

    // Slowly drifting blob forms around the core
    if (blob1Ref.current) {
      blob1Ref.current.rotation.x = t * 0.13;
      blob1Ref.current.rotation.y = t * 0.07;
    }
    if (blob2Ref.current) {
      blob2Ref.current.rotation.x = -t * 0.09;
      blob2Ref.current.rotation.z = t * 0.11;
    }
    if (blob3Ref.current) {
      blob3Ref.current.rotation.y = t * 0.15;
      blob3Ref.current.rotation.z = -t * 0.08;
    }

    // Point light pulse follows core
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 2.5 + 1.5 * Math.sin(t * 1.2);
    }
  });

  return (
    <group visible={visible}>
      {/* Deep ambient — just enough to make forms visible */}
      <ambientLight intensity={0.04} color="#1a0800" />

      {/* Warm amber point light — the source of warmth */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0, 0]}
        color="#ff6b1a"
        intensity={3.0}
        distance={12}
        decay={2}
      />

      {/* Soft rim from above — suggests emergence */}
      <pointLight
        position={[0, 4, -2]}
        color="#ffaa44"
        intensity={0.8}
        distance={10}
        decay={2}
      />

      {/* Core pulsing sphere — the origin point */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#ff8c00"
          emissive="#ff4400"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.0}
        />
      </mesh>

      {/* Blob 1 — formless shape orbiting the core */}
      <mesh ref={blob1Ref} position={[1.4, 0.3, -0.5]}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color="#3a1500"
          emissive="#6b2a00"
          emissiveIntensity={0.3}
          roughness={0.9}
          metalness={0.0}
          wireframe={false}
        />
      </mesh>

      {/* Blob 2 — another amorphous presence */}
      <mesh ref={blob2Ref} position={[-1.1, -0.6, -1.0]}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#1a0800"
          emissive="#4d1a00"
          emissiveIntensity={0.25}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Blob 3 — upper formless shape */}
      <mesh ref={blob3Ref} position={[0.5, 1.3, -0.8]}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial
          color="#2a0d00"
          emissive="#5c2200"
          emissiveIntensity={0.2}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Background dark sphere — the void */}
      <mesh position={[0, 0, -4]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshStandardMaterial
          color="#050200"
          side={THREE.BackSide}
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}
