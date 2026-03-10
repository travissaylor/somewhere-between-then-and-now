import { ERA_CONFIG } from '@/config/eras';

const MAX_ERA = ERA_CONFIG.length - 1; // 12

export interface ScenePair {
  fromEra: number;
  toEra: number;
  blend: number;
}

/**
 * Returns the overlap fraction for a given era boundary index.
 * Default is 10% of era scroll distance. Allows per-boundary customization later.
 */
export function getOverlapRegion(_eraIndex: number): number {
  // Default: 10% overlap at the tail end of each era.
  // Per-boundary values can be added here as the project matures (Phase 8).
  return 0.1;
}

/**
 * Pure function: computes the blend factor between two eras.
 * Blend is 0 for most of the era's scroll distance, then ramps linearly
 * from 0 → 1 during the overlap region at the tail end.
 *
 * @param eraProgress - 0-1 progress within the current era
 * @param overlapFraction - fraction of era scroll distance used for the overlap region (default 0.1)
 * @returns blend factor 0-1
 */
export function computeBlendFactor(
  eraProgress: number,
  overlapFraction: number = 0.1
): number {
  if (eraProgress >= 1.0) return 1;
  const overlapStart = 1.0 - overlapFraction;
  if (eraProgress <= overlapStart) return 0;
  // Linear ramp from overlapStart → 1.0
  return (eraProgress - overlapStart) / overlapFraction;
}

/**
 * Determines which two era scenes should be assigned to render targets A and B,
 * and computes the blend factor between them.
 *
 * At the last era (id=12) there is no next era, so blend stays at 0 and toEra = fromEra.
 *
 * @param currentEra - integer 0-12
 * @param eraProgress - 0-1 within current era
 */
export function getScenePair(currentEra: number, eraProgress: number): ScenePair {
  const fromEra = currentEra;

  // Last era: no transition possible
  if (currentEra >= MAX_ERA) {
    return { fromEra, toEra: fromEra, blend: 0 };
  }

  const toEra = currentEra + 1;
  const overlapFraction = getOverlapRegion(currentEra);
  const blend = computeBlendFactor(eraProgress, overlapFraction);

  return { fromEra, toEra, blend };
}
