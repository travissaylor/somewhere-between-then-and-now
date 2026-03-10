import * as THREE from 'three';
import { getGPUTier } from 'detect-gpu';

export interface RenderBudget {
  keepAliveWindow: number;
  renderTargetType: typeof THREE.HalfFloatType | typeof THREE.UnsignedByteType;
}

/**
 * Default render budget used before async GPU detection completes.
 * Assumes a capable GPU so the experience starts at full quality.
 */
export const DEFAULT_RENDER_BUDGET: RenderBudget = {
  keepAliveWindow: 3,
  renderTargetType: THREE.HalfFloatType,
};

/**
 * Detects GPU tier and returns an appropriate render budget.
 * - Tier 3+: ±3 eras, HalfFloat (desktop-class GPU)
 * - Tier 2:  ±2 eras, HalfFloat (mid-range GPU)
 * - Tier 0-1: ±1 era, UnsignedByte (low-end / integrated GPU)
 */
export async function detectRenderBudget(): Promise<RenderBudget> {
  const { tier } = await getGPUTier();
  if (tier >= 3) {
    return { keepAliveWindow: 3, renderTargetType: THREE.HalfFloatType };
  }
  if (tier >= 2) {
    return { keepAliveWindow: 2, renderTargetType: THREE.HalfFloatType };
  }
  // tier 0-1: low-end GPU
  return { keepAliveWindow: 1, renderTargetType: THREE.UnsignedByteType };
}
