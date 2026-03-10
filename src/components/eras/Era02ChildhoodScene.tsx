'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Era02ChildhoodSceneProps {
  visible?: boolean;
}

/**
 * Era 02 — Early Childhood
 *
 * Backyard diorama. Concrete warmth after abstract darkness.
 * Procedural geometry only — no loaded assets.
 * Feeling: Super 8 warmth, golden hour, grass under feet, safety.
 */
export default function Era02ChildhoodScene({ visible = true }: Era02ChildhoodSceneProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Very slow golden-hour light shift — barely perceptible movement
    if (lightRef.current) {
      lightRef.current.position.x = -4 + 0.3 * Math.sin(t * 0.05);
      lightRef.current.intensity = 1.8 + 0.2 * Math.sin(t * 0.1);
    }

    // Subtle shadow movement on ground
    if (shadowRef.current) {
      shadowRef.current.position.x = 0.1 * Math.sin(t * 0.08);
    }
  });

  return (
    <group visible={visible}>
      {/* Sky — warm blue, slightly golden at horizon */}
      <mesh position={[0, 0, -6]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial
          color="#87ceeb"
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>

      {/* Horizon glow — golden hour warmth near ground level */}
      <mesh position={[0, -1.8, -5.5]}>
        <planeGeometry args={[40, 4]} />
        <meshStandardMaterial
          color="#f4a261"
          emissive="#e07b39"
          emissiveIntensity={0.4}
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>

      {/* Ground — grass green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#4a7c3f"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* House — main body, warm white siding */}
      <mesh position={[0.5, -0.2, -2]}>
        <boxGeometry args={[2.2, 1.8, 1.5]} />
        <meshStandardMaterial
          color="#f5e6d3"
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Roof — simple triangle form, red-brown shingle */}
      <mesh position={[0.5, 0.95, -2]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.8, 1.2, 4]} />
        <meshStandardMaterial
          color="#8b4513"
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>

      {/* Door — dark wood rectangle */}
      <mesh position={[0.5, -0.6, -1.24]}>
        <boxGeometry args={[0.5, 0.8, 0.05]} />
        <meshStandardMaterial
          color="#5c3d1e"
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Window left */}
      <mesh position={[-0.4, -0.1, -1.24]}>
        <boxGeometry args={[0.45, 0.4, 0.05]} />
        <meshStandardMaterial
          color="#a8d8ea"
          emissive="#ffdd88"
          emissiveIntensity={0.3}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>

      {/* Window right */}
      <mesh position={[1.4, -0.1, -1.24]}>
        <boxGeometry args={[0.45, 0.4, 0.05]} />
        <meshStandardMaterial
          color="#a8d8ea"
          emissive="#ffdd88"
          emissiveIntensity={0.3}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>

      {/* Tree trunk — left side */}
      <mesh position={[-2.5, -0.9, -1.5]}>
        <cylinderGeometry args={[0.12, 0.16, 1.2, 8]} />
        <meshStandardMaterial
          color="#6b4423"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Tree canopy */}
      <mesh position={[-2.5, 0.3, -1.5]}>
        <sphereGeometry args={[0.7, 10, 10]} />
        <meshStandardMaterial
          color="#3d6b2e"
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>

      {/* Shadow patch on grass (subtle dark oval) */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.5, -1.49, -2]}
      >
        <circleGeometry args={[1.2, 16]} />
        <meshStandardMaterial
          color="#2a4a20"
          roughness={1.0}
          metalness={0.0}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Golden hour directional light — low angle, warm */}
      <directionalLight
        ref={lightRef}
        position={[-4, 2, 3]}
        color="#ffcc66"
        intensity={1.8}
        castShadow={false}
      />

      {/* Soft fill light from sky */}
      <ambientLight intensity={0.5} color="#d4eeff" />

      {/* Subtle warm bounce from ground */}
      <pointLight
        position={[0, -1.0, 0]}
        color="#88aa44"
        intensity={0.4}
        distance={8}
        decay={2}
      />
    </group>
  );
}
