import type { Era, EraParams, RGB } from '../state';
import { FADE_START } from './eras';

export interface Located {
  eraIndex: number;
  eraT: number;
  eraA: number;
  eraB: number;
  mix: number;
}

export interface Timeline {
  readonly eras: Era[];
  /** Cumulative era start positions in progress space, length eras.length + 1, first 0 and last 1. */
  boundaries(): number[];
  locate(t: number): Located;
  paramsAt(t: number): EraParams;
  /** World distance walked by progress t. Monotonic. */
  walkDistanceAt(t: number): number;
  /** 0..1 fade to black in the final stretch. */
  fadeAt(t: number): number;
  getWeights(): number[];
  setWeights(weights: number[]): void;
}

/** Fraction of an era's span, on each side of a boundary, over which params drift to the next era. */
const WINDOW = 0.2;
/** How far the camera walks over a whole pass, in world units, at walkSpeed 1 throughout. */
const WALK_SCALE = 120;
const SAMPLES = 2048;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpRGB = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export function lerpParams(a: EraParams, b: EraParams, k: number): EraParams {
  if (k <= 0) return a;
  if (k >= 1) return b;
  return {
    bg: lerpRGB(a.bg, b.bg, k),
    fogDensity: lerp(a.fogDensity, b.fogDensity, k),
    light: lerpRGB(a.light, b.light, k),
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity, k),
    lightHeight: lerp(a.lightHeight, b.lightHeight, k),
    ground: lerpRGB(a.ground, b.ground, k),
    walls: lerp(a.walls, b.walls, k),
    wallsHeight: lerp(a.wallsHeight, b.wallsHeight, k),
    wallColor: lerpRGB(a.wallColor, b.wallColor, k),
    grain: lerp(a.grain, b.grain, k),
    grainSize: lerp(a.grainSize, b.grainSize, k),
    warmth: lerp(a.warmth, b.warmth, k),
    saturation: lerp(a.saturation, b.saturation, k),
    contrast: lerp(a.contrast, b.contrast, k),
    vignette: lerp(a.vignette, b.vignette, k),
    blur: lerp(a.blur, b.blur, k),
    tilt: lerp(a.tilt, b.tilt, k),
    walkSpeed: lerp(a.walkSpeed, b.walkSpeed, k),
    stillness: lerp(a.stillness, b.stillness, k),
    speedSensitivity: lerp(a.speedSensitivity, b.speedSensitivity, k),
    drone: {
      root: lerp(a.drone.root, b.drone.root, k),
      interval: lerp(a.drone.interval, b.drone.interval, k),
      brightness: lerp(a.drone.brightness, b.drone.brightness, k),
      noise: lerp(a.drone.noise, b.drone.noise, k),
      sub: lerp(a.drone.sub, b.drone.sub, k),
      heartbeat: lerp(a.drone.heartbeat, b.drone.heartbeat, k),
      bpm: lerp(a.drone.bpm, b.drone.bpm, k),
      drive: lerp(a.drone.drive, b.drone.drive, k),
      volume: lerp(a.drone.volume, b.drone.volume, k),
    },
  };
}

export function createTimeline(eras: Era[]): Timeline {
  let weights = eras.map((e) => e.weight);
  let bounds: number[] = [];
  let walkTable: Float64Array = new Float64Array(SAMPLES + 1);

  function rebuild() {
    const total = weights.reduce((s, w) => s + w, 0);
    bounds = [0];
    let acc = 0;
    for (const w of weights) {
      acc += w / total;
      bounds.push(acc);
    }
    bounds[bounds.length - 1] = 1;
    // Integrate walk speed over progress so the camera's distance is smooth across drifts.
    walkTable = new Float64Array(SAMPLES + 1);
    let d = 0;
    for (let i = 1; i <= SAMPLES; i++) {
      const t0 = (i - 1) / SAMPLES;
      const t1 = i / SAMPLES;
      const v = (paramsAt(t0).walkSpeed + paramsAt(t1).walkSpeed) * 0.5;
      d += v * (t1 - t0) * WALK_SCALE;
      walkTable[i] = d;
    }
  }

  function eraIndexOf(t: number): number {
    const x = clamp01(t);
    for (let i = 0; i < eras.length; i++) {
      if (x < bounds[i + 1]) return i;
    }
    return eras.length - 1;
  }

  function locate(t: number): Located {
    const x = clamp01(t);
    const i = eraIndexOf(x);
    const start = bounds[i];
    const end = bounds[i + 1];
    const span = end - start;
    const eraT = span > 0 ? (x - start) / span : 0;
    let eraA = i;
    let eraB = i;
    let mix = 0;
    // Upper window: drifting toward the next era.
    if (i < eras.length - 1) {
      const nextSpan = bounds[i + 2] - bounds[i + 1];
      const w = WINDOW * Math.min(span, nextSpan);
      if (x > end - w) {
        eraB = i + 1;
        mix = smoothstep(end - w, end + w, x);
      }
    }
    // Lower window: still finishing the drift from the previous era.
    if (mix === 0 && i > 0) {
      const prevSpan = bounds[i] - bounds[i - 1];
      const w = WINDOW * Math.min(span, prevSpan);
      if (x < start + w) {
        eraA = i - 1;
        mix = smoothstep(start - w, start + w, x);
      }
    }
    return { eraIndex: i, eraT, eraA, eraB, mix };
  }

  function paramsAt(t: number): EraParams {
    const l = locate(t);
    return lerpParams(eras[l.eraA].params, eras[l.eraB].params, l.mix);
  }

  function walkDistanceAt(t: number): number {
    const x = clamp01(t) * SAMPLES;
    const i = Math.floor(x);
    if (i >= SAMPLES) return walkTable[SAMPLES];
    return lerp(walkTable[i], walkTable[i + 1], x - i);
  }

  function fadeAt(t: number): number {
    return smoothstep(FADE_START, 1, t);
  }

  rebuild();

  return {
    eras,
    boundaries: () => bounds.slice(),
    locate,
    paramsAt,
    walkDistanceAt,
    fadeAt,
    getWeights: () => weights.slice(),
    setWeights: (w) => {
      if (w.length !== eras.length) throw new Error('weights length must match eras');
      weights = w.slice();
      rebuild();
    },
  };
}
