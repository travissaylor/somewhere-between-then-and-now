import { ERA_CONFIG } from '@/config/eras';

// Pre-compute cumulative weight boundaries (run once at module load)
const totalWeight = ERA_CONFIG.reduce((sum, era) => sum + era.weight, 0);

export const eraBoundaries = ERA_CONFIG.reduce<{ start: number; end: number }[]>(
  (acc, era, idx) => {
    const start = idx === 0 ? 0 : acc[idx - 1].end;
    const end = start + era.weight / totalWeight;
    acc.push({ start, end });
    return acc;
  },
  []
);

/**
 * Maps a global scroll progress (0-1) to an era-aware decomposition.
 * Respects per-era scroll weights so major transitions occupy more scroll distance.
 *
 * @param globalProgress - Normalized scroll position (0 = top, 1 = bottom)
 * @returns currentEra (0-12 integer) and eraProgress (0-1 within that era)
 */
export function computeEraProgress(globalProgress: number): {
  currentEra: number;
  eraProgress: number;
} {
  // Clamp to [0, 1]
  const p = Math.max(0, Math.min(1, globalProgress));

  // Find which era we're in
  let currentEra = ERA_CONFIG.length - 1;
  for (let i = 0; i < eraBoundaries.length; i++) {
    if (p <= eraBoundaries[i].end) {
      currentEra = i;
      break;
    }
  }

  const { start, end } = eraBoundaries[currentEra];
  const eraProgress = end > start ? (p - start) / (end - start) : 0;

  return { currentEra, eraProgress: Math.max(0, Math.min(1, eraProgress)) };
}

/**
 * Computes total scroll height in vh units based on era weights.
 * Used to set the height of the scroll container div.
 *
 * @param baseVh - Base viewport heights per era at weight 1.0 (default: 500)
 * @returns Total scroll height in vh units
 */
export function computeScrollHeight(baseVh = 500): number {
  return baseVh * (totalWeight / ERA_CONFIG.length);
}
