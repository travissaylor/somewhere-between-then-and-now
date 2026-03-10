'use client';

import * as THREE from 'three';
import dissolveVert from '@/shaders/dissolve.vert.glsl';
import dissolveFrag from '@/shaders/dissolve.frag.glsl';

/**
 * Factory function — returns a configured THREE.ShaderMaterial for the A/B era dissolve compositor.
 *
 * Used by Compositor.tsx as the material for a fullscreen orthographic quad that
 * blends two render-target textures using Perlin noise threshold dissolve.
 *
 * Uniforms are mutated each frame by the compositor's useFrame hook:
 *   - tFrom.value  ← render target A texture (the "from" era)
 *   - tTo.value    ← render target B texture (the "to" era)
 *   - uBlend.value ← blend factor from compositorLogic.getScenePair()
 */
export function createCompositorMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: dissolveVert,
    fragmentShader: dissolveFrag,
    uniforms: {
      tFrom:       { value: null },
      tTo:         { value: null },
      uBlend:      { value: 0 },
      uNoiseScale: { value: 2.0 },
      uEdgeWidth:  { value: 0.08 },
    },
    // Fullscreen quad — depth testing is irrelevant
    depthTest:  false,
    depthWrite: false,
  });
}
