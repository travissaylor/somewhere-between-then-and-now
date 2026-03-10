const MIN_ERA = 0;
const MAX_ERA = 12;

export interface MemoryPlan {
  /** Eras that should be rendered and kept in VRAM (current ± keepAliveWindow) */
  visible: number[];
  /** Next era beyond the visible window to preload proactively */
  preload: number[];
  /** Eras that are currently loaded but outside the visible window (to dispose) */
  dispose: number[];
}

/**
 * Pure function — determines which eras to keep alive, which to preload, and
 * which to dispose based on the current era and GPU tier keep-alive window.
 *
 * @param currentEra - integer 0-12, the era the user is currently viewing
 * @param keepAliveWindow - number of eras to keep on each side of currentEra
 * @param loadedEras - optional Set of currently loaded era indices; used to compute dispose list
 * @returns MemoryPlan with visible, preload, and dispose arrays
 */
export function getMemoryPlan(
  currentEra: number,
  keepAliveWindow: number,
  loadedEras?: Set<number>
): MemoryPlan {
  // Compute the visible window: currentEra ± keepAliveWindow, clamped to valid range
  const windowStart = Math.max(MIN_ERA, currentEra - keepAliveWindow);
  const windowEnd = Math.min(MAX_ERA, currentEra + keepAliveWindow);

  const visible: number[] = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    visible.push(i);
  }

  // Preload: the next era beyond the far edge of the visible window
  const preloadCandidate = windowEnd + 1;
  const preload: number[] = preloadCandidate <= MAX_ERA ? [preloadCandidate] : [];

  // Dispose: loaded eras that fall outside the visible window
  const dispose: number[] = [];
  if (loadedEras) {
    for (const era of loadedEras) {
      if (!visible.includes(era)) {
        dispose.push(era);
      }
    }
  }

  return { visible, preload, dispose };
}
