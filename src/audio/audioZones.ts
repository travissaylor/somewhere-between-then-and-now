import type { AudioZoneConfig } from '@/audio/audioMath';

/**
 * Audio zone configurations for all 13 eras.
 *
 * Each entry maps an era (by index 0-12) to its audio stem URL and crossfade overlap width.
 *
 * NOTE: The overlapWidth values here are scaffold defaults (0.1 = 10% of era duration).
 * These are intentionally uniform placeholders for authorial tuning — the same pattern
 * used by ERA_CONFIG weights, which are also scaffold values awaiting creative refinement.
 * A tighter overlap (e.g. 0.05) creates a sharper transition; a wider one (e.g. 0.2)
 * creates a longer, more seamless blend.
 *
 * NOTE: The actual .mp3 stem files do NOT need to exist at this stage.
 * The AudioEngine (Plan 02, AUDO-06) handles graceful fallback when a stem URL
 * returns a 404 or fails to load.
 */
export const AUDIO_ZONES: AudioZoneConfig[] = [
  { eraIndex: 0,  stemUrl: '/audio/era-00.mp3', overlapWidth: 0.1 },
  { eraIndex: 1,  stemUrl: '/audio/era-01.mp3', overlapWidth: 0.1 },
  { eraIndex: 2,  stemUrl: '/audio/era-02.mp3', overlapWidth: 0.1 },
  { eraIndex: 3,  stemUrl: '/audio/era-03.mp3', overlapWidth: 0.1 },
  { eraIndex: 4,  stemUrl: '/audio/era-04.mp3', overlapWidth: 0.1 },
  { eraIndex: 5,  stemUrl: '/audio/era-05.mp3', overlapWidth: 0.1 },
  { eraIndex: 6,  stemUrl: '/audio/era-06.mp3', overlapWidth: 0.1 },
  { eraIndex: 7,  stemUrl: '/audio/era-07.mp3', overlapWidth: 0.1 },
  { eraIndex: 8,  stemUrl: '/audio/era-08.mp3', overlapWidth: 0.1 },
  { eraIndex: 9,  stemUrl: '/audio/era-09.mp3', overlapWidth: 0.1 },
  { eraIndex: 10, stemUrl: '/audio/era-10.mp3', overlapWidth: 0.1 },
  { eraIndex: 11, stemUrl: '/audio/era-11.mp3', overlapWidth: 0.1 },
  { eraIndex: 12, stemUrl: '/audio/era-12.mp3', overlapWidth: 0.1 },
];
