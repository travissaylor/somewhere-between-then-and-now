/**
 * Pure gain computation for scroll-reactive audio mixing.
 *
 * All functions in this module are pure TypeScript with no browser or Web Audio dependencies,
 * enabling full unit testing in the Node/Vitest environment.
 */

/**
 * Configuration for a single audio zone (one per era).
 */
export interface AudioZoneConfig {
  /** Era index 0-12 matching ERA_CONFIG */
  eraIndex: number;
  /** URL to the audio stem file (e.g. /audio/era-00.mp3) */
  stemUrl: string;
  /** Crossfade overlap width as a fraction of era progress [0, 1]. Default 0.1 = 10% of era. */
  overlapWidth: number;
}

/**
 * Computes the TARGET gain value for a given era based on current scroll state.
 *
 * CONTRACT: This function returns the target gain value only. The AudioEngine (Plan 02)
 * is responsible for applying it smoothly via `gain.gain.rampTo(target, 0.05)` —
 * never via direct `.value` assignment. This separation ensures smooth audio transitions
 * without clicks or pops.
 *
 * Fade logic:
 * - Active era (eraIndex === currentEra): fades IN over the overlap region.
 *   At eraProgress=0 gain is 0; at eraProgress=overlapWidth gain reaches 1.0.
 * - Previous era (eraIndex === currentEra - 1): fades OUT over the overlap region.
 *   At eraProgress=0 gain is 1; at eraProgress=overlapWidth gain reaches 0.0.
 * - All other eras: gain is 0.
 * - When overlapWidth=0: active era gets 1.0 immediately, all others get 0.0 (no division by zero).
 * - All results are clamped to [0, 1].
 *
 * @param eraIndex    - Index of the era whose gain we are computing (0-12)
 * @param currentEra  - The currently active era from scroll state (0-12)
 * @param eraProgress - Progress within the current era [0, 1]
 * @param overlapWidth - Crossfade overlap width as fraction of era [0, 1]
 * @returns Target gain value in [0, 1]
 */
export function computeGainForEra(
  eraIndex: number,
  currentEra: number,
  eraProgress: number,
  overlapWidth: number,
): number {
  // Edge case: no overlap — instant switch
  if (overlapWidth === 0) {
    return eraIndex === currentEra ? 1.0 : 0.0;
  }

  if (eraIndex === currentEra) {
    // Active era: fade in from 0 to 1 over overlap region
    const gain = eraProgress / overlapWidth;
    return Math.min(1.0, Math.max(0.0, gain));
  }

  if (eraIndex === currentEra - 1) {
    // Previous era: fade out from 1 to 0 over overlap region
    const gain = 1 - eraProgress / overlapWidth;
    return Math.min(1.0, Math.max(0.0, gain));
  }

  // All other eras: silent
  return 0.0;
}
