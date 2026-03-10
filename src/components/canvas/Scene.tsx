'use client';

import { Canvas } from '@react-three/fiber';

function PlaceholderContent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1a1a2e" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        pointerEvents: 'none',
      }}
      camera={{
        fov: 50,
        near: 0.1,
        far: 1000,
        position: [0, 0, 5],
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <PlaceholderContent />
    </Canvas>
  );
}
