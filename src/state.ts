/**
 * Shared contract for every module in the piece.
 *
 * Progress `t` runs from 0 (darkness before birth) to 1 (the horizon has faded).
 * Every system reads the same FrameState each frame and holds no other notion of
 * "where the viewer is". Nothing here imports three.js; colors are plain tuples.
 */

/** sRGB in 0..1. Scene code converts to linear when building three.js colors. */
export type RGB = [number, number, number];

export interface DroneParams {
  /** Root frequency in Hz of the era's sustained tone. */
  root: number;
  /** Interval in semitones of a second voice above the root. 0 = unison. */
  interval: number;
  /** 0..1 lowpass openness. 0 is muffled and close, 1 is bright. */
  brightness: number;
  /** 0..1 amount of shaped noise (wind, crowd, hiss). */
  noise: number;
  /** 0..1 amount of sub-bass under the root. */
  sub: number;
  /** 0..1 amount of heartbeat pulse. */
  heartbeat: number;
  /** Heartbeat or pulse tempo in beats per minute. */
  bpm: number;
  /** 0..1 how much of the era's sound is rhythmic energy that scroll speed can push. */
  drive: number;
  /** 0..1 overall level. 0 is silence. */
  volume: number;
}

export interface EraParams {
  /** Background and fog color. */
  bg: RGB;
  /** Exponential fog density. Higher is closer and more enclosed. */
  fogDensity: number;
  /** The Light's color. */
  light: RGB;
  /** The Light's intensity. 0 is darkness. */
  lightIntensity: number;
  /** Height of the Light above the ground, world units. */
  lightHeight: number;
  /** The Ground's color. */
  ground: RGB;
  /** 0..1 how present the Walls are. 0 is open sky. */
  walls: number;
  /** Ceiling height factor. 1 is normal, below 1 is too low. */
  wallsHeight: number;
  /** The Walls' color. */
  wallColor: RGB;
  /** 0..1 film grain amount. */
  grain: number;
  /** Grain scale. 1 is fine, larger is coarser. */
  grainSize: number;
  /** -1..1 color temperature shift. Negative is cold, positive is warm. */
  warmth: number;
  /** Saturation multiplier. 0 is monochrome, 1 is neutral, above 1 is oversaturated. */
  saturation: number;
  /** Contrast multiplier. 1 is neutral. */
  contrast: number;
  /** 0..1 vignette strength. */
  vignette: number;
  /** 0..1 blur amount. */
  blur: number;
  /** Camera roll in radians. The abuse era tilts. */
  tilt: number;
  /** World units the camera walks per unit of progress inside this era, before weight scaling. */
  walkSpeed: number;
  /** 0..1. 1 means the world is completely still: no breathing, no drift, no walk. */
  stillness: number;
  /** 0..1 how much scroll speed feeds audio energy (and visuals in chaos). */
  speedSensitivity: number;
  /** Sound of the era. */
  drone: DroneParams;
}

export interface Era {
  /** Two-digit id, "01" through "13". */
  id: string;
  title: string;
  /** Share of total scroll distance. Relative to the other eras. */
  weight: number;
  params: EraParams;
}

export type Phase = 'entry' | 'walking' | 'over';

export interface FrameState {
  /** 0..1 progress through the piece. */
  t: number;
  /** Progress per second. Never negative. */
  velocity: number;
  /** 0..1 normalized scroll speed for reactivity. */
  speed: number;
  /** Index of the current era in ERAS. */
  eraIndex: number;
  /** 0..1 progress within the current era. */
  eraT: number;
  /** Index of the era whose sound and look are fading out. Equals eraB when no blend is active. */
  eraA: number;
  /** Index of the era fading in. */
  eraB: number;
  /** 0..1 mix from eraA toward eraB. 0 for most of an era; only nonzero inside a boundary window. */
  mix: number;
  /** Interpolated params for this frame: lerp(ERAS[eraA].params, ERAS[eraB].params, mix). Read these, not ERAS[i].params. */
  params: EraParams;
  /** World distance the camera has walked. Monotonic in t. */
  walkDistance: number;
  /** 0..1 fade to black at the very end. 0 until the last stretch of the horizon. */
  fade: number;
  /** Seconds since the viewer clicked begin. 0 before that. */
  sinceBegin: number;
  /** Seconds since the last frame. */
  dt: number;
  /** Seconds since page load. */
  elapsed: number;
  phase: Phase;
  reducedMotion: boolean;
}

/** Reference scroll speed in progress per second that counts as "fast". A five minute pass is ~0.0033/s. */
export const FAST_SPEED = 0.012;
