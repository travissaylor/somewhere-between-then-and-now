'use client';

import * as THREE from 'three';
import wombVert from '@/shaders/womb.vert.glsl';
import wombFrag from '@/shaders/womb.frag.glsl';

/**
 * Factory function — returns a configured THREE.ShaderMaterial for the womb heartbeat loading gate.
 *
 * Used by WombGate.tsx as the material for a fullscreen quad that renders the
 * pre-birth loading state: deep red-black darkness pulsing at ~70bpm, accelerating
 * into a white-warm birth flash when loading completes.
 *
 * Uniforms updated each frame by the womb animation loop:
 *   - uTime.value         ← elapsed seconds (from useFrame's clock.elapsedTime)
 *   - uBirthProgress.value ← 0=resting, 1=full birth flash
 *   - uIntensity.value    ← pulse intensity multiplier (normally 1.0)
 */
export function createWombMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: wombVert,
    fragmentShader: wombFrag,
    uniforms: {
      uTime:          { value: 0 },
      uBeatRate:      { value: 1.167 },  // 70bpm = 70/60 Hz
      uIntensity:     { value: 1.0 },
      uBirthProgress: { value: 0 },
    },
    // Fullscreen quad — depth testing is irrelevant
    depthTest:  false,
    depthWrite: false,
  });
}
