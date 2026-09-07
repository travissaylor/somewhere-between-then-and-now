import type { Era, RGB } from '../state';

/** Hex color to sRGB tuple. */
export const hex = (h: number): RGB => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

/**
 * The thirteen eras. Palette, texture, walk, and sound per era, straight from the
 * brief. Weights are the pacing table in the brief; tune them by feel.
 * The arc is fixed. The exact count and borders are not.
 */
export const ERAS: Era[] = [
  {
    id: '01', title: 'Being Born', weight: 0.6,
    params: {
      bg: hex(0x3a2208), fogDensity: 0.9,
      light: hex(0xffd27a), lightIntensity: 1.0, lightHeight: 1.6,
      ground: hex(0x3a2208), walls: 0, wallsHeight: 1, wallColor: hex(0x3a2208),
      grain: 0.45, grainSize: 2.0, warmth: 0.6, saturation: 0.9, contrast: 0.9, vignette: 0.65, blur: 0.5,
      tilt: 0, walkSpeed: 0.4, stillness: 0.2, speedSensitivity: 0.1,
      drone: { root: 55, interval: 7, brightness: 0.15, noise: 0.1, sub: 0.6, heartbeat: 1, bpm: 70, drive: 0, volume: 0.7 },
    },
  },
  {
    id: '02', title: 'Early Childhood', weight: 1.0,
    params: {
      bg: hex(0x7fb8e6), fogDensity: 0.15,
      light: hex(0xffcc66), lightIntensity: 1.4, lightHeight: 4,
      ground: hex(0x4f9a3a), walls: 0, wallsHeight: 1, wallColor: hex(0xd8c9a0),
      grain: 0.5, grainSize: 2.0, warmth: 0.4, saturation: 1.15, contrast: 1.05, vignette: 0.35, blur: 0.1,
      tilt: 0, walkSpeed: 1.0, stillness: 0, speedSensitivity: 0.2,
      drone: { root: 220, interval: 4, brightness: 0.7, noise: 0.35, sub: 0.1, heartbeat: 0, bpm: 0, drive: 0.1, volume: 0.6 },
    },
  },
  {
    id: '03', title: 'The Abuse Era', weight: 1.0,
    params: {
      bg: hex(0x1a1006), fogDensity: 0.5,
      light: hex(0xff8a1f), lightIntensity: 1.2, lightHeight: 1.6,
      ground: hex(0x4a3410), walls: 1, wallsHeight: 0.7, wallColor: hex(0x6b4a15),
      grain: 0.8, grainSize: 3.0, warmth: 0.5, saturation: 0.9, contrast: 1.3, vignette: 0.7, blur: 0.15,
      tilt: 0.04, walkSpeed: 0.6, stillness: 0, speedSensitivity: 0.1,
      drone: { root: 41.2, interval: 6, brightness: 0.2, noise: 0.25, sub: 0.9, heartbeat: 0.3, bpm: 90, drive: 0.1, volume: 0.7 },
    },
  },
  {
    id: '04', title: 'The Divorce', weight: 1.2,
    params: {
      bg: hex(0x8a98a8), fogDensity: 0.35,
      light: hex(0xdfe8f0), lightIntensity: 0.8, lightHeight: 2.5,
      ground: hex(0xb8b0a0), walls: 0.6, wallsHeight: 1, wallColor: hex(0xc9c4b8),
      grain: 0.3, grainSize: 1.0, warmth: -0.5, saturation: 0.5, contrast: 0.95, vignette: 0.4, blur: 0.05,
      tilt: 0, walkSpeed: 0.3, stillness: 0.6, speedSensitivity: 0,
      drone: { root: 110, interval: 1, brightness: 0.5, noise: 0.05, sub: 0.1, heartbeat: 0, bpm: 0, drive: 0, volume: 0.45 },
    },
  },
  {
    id: '05', title: 'Teenage Years & Sports', weight: 0.8,
    params: {
      bg: hex(0x23324a), fogDensity: 0.1,
      light: hex(0xffd24a), lightIntensity: 2.5, lightHeight: 6,
      ground: hex(0x2f8f3a), walls: 0, wallsHeight: 1, wallColor: hex(0x2f8f3a),
      grain: 0.2, grainSize: 1.2, warmth: 0.3, saturation: 1.5, contrast: 1.15, vignette: 0.3, blur: 0.05,
      tilt: 0, walkSpeed: 1.6, stillness: 0, speedSensitivity: 0.5,
      drone: { root: 55, interval: 7, brightness: 0.8, noise: 0.5, sub: 0.6, heartbeat: 0, bpm: 120, drive: 0.7, volume: 0.8 },
    },
  },
  {
    id: '06', title: 'College', weight: 0.9,
    params: {
      bg: hex(0x1a2560), fogDensity: 0.08,
      light: hex(0xffb347), lightIntensity: 2.8, lightHeight: 7,
      ground: hex(0x2f7a3a), walls: 0, wallsHeight: 2, wallColor: hex(0x8a1f2e),
      grain: 0.1, grainSize: 1.0, warmth: 0.2, saturation: 1.6, contrast: 1.2, vignette: 0.25, blur: 0.2,
      tilt: 0, walkSpeed: 2.0, stillness: 0, speedSensitivity: 0.6,
      drone: { root: 65.4, interval: 7, brightness: 0.9, noise: 0.6, sub: 0.6, heartbeat: 0, bpm: 128, drive: 0.9, volume: 0.9 },
    },
  },
  {
    id: '07', title: 'The Identity Years', weight: 0.8,
    params: {
      bg: hex(0x3a3d33), fogDensity: 0.3,
      light: hex(0xb9b39a), lightIntensity: 0.6, lightHeight: 3,
      ground: hex(0x4a4a3c), walls: 0.5, wallsHeight: 1.2, wallColor: hex(0x55584a),
      grain: 0, grainSize: 1.0, warmth: -0.1, saturation: 0.7, contrast: 1.0, vignette: 0.4, blur: 0.05,
      tilt: 0, walkSpeed: 0.8, stillness: 0, speedSensitivity: 0.2,
      drone: { root: 130.8, interval: 5, brightness: 0.4, noise: 0.2, sub: 0.2, heartbeat: 0, bpm: 0, drive: 0.1, volume: 0.45 },
    },
  },
  {
    id: '08', title: 'The Seven Years', weight: 1.1,
    params: {
      bg: hex(0x7a6a9a), fogDensity: 0.3,
      light: hex(0xffb8c8), lightIntensity: 1.1, lightHeight: 2,
      ground: hex(0x5a4a6a), walls: 0.8, wallsHeight: 1, wallColor: hex(0x9a86b4),
      grain: 0, grainSize: 1.0, warmth: 0.15, saturation: 1.0, contrast: 1.0, vignette: 0.4, blur: 0.05,
      tilt: 0, walkSpeed: 0.7, stillness: 0, speedSensitivity: 0.15,
      drone: { root: 98, interval: 3, brightness: 0.55, noise: 0.3, sub: 0.45, heartbeat: 0, bpm: 0, drive: 0.1, volume: 0.6 },
    },
  },
  {
    id: '09', title: 'The Breakup', weight: 1.4,
    params: {
      bg: hex(0x0a0a0c), fogDensity: 0.6,
      light: hex(0xe8e8f0), lightIntensity: 0.5, lightHeight: 0.3,
      ground: hex(0x16161a), walls: 0.9, wallsHeight: 1, wallColor: hex(0x2a2a30),
      grain: 0.1, grainSize: 1.0, warmth: -0.3, saturation: 0, contrast: 1.2, vignette: 0.6, blur: 0,
      tilt: 0, walkSpeed: 0.1, stillness: 1, speedSensitivity: 0,
      drone: { root: 49, interval: 0, brightness: 0.1, noise: 0, sub: 0.3, heartbeat: 0, bpm: 0, drive: 0, volume: 0.15 },
    },
  },
  {
    id: '10', title: 'Pittsburgh & The House', weight: 0.9,
    params: {
      bg: hex(0x1c1a12), fogDensity: 0.25,
      light: hex(0xffc72c), lightIntensity: 1.6, lightHeight: 2.5,
      ground: hex(0x2a2418), walls: 0.9, wallsHeight: 1.1, wallColor: hex(0x5a4a10),
      grain: 0, grainSize: 1.0, warmth: 0.35, saturation: 0.9, contrast: 1.1, vignette: 0.4, blur: 0,
      tilt: 0, walkSpeed: 0.9, stillness: 0, speedSensitivity: 0.15,
      drone: { root: 73.4, interval: 7, brightness: 0.5, noise: 0.1, sub: 0.3, heartbeat: 0, bpm: 80, drive: 0.3, volume: 0.55 },
    },
  },
  {
    id: '11', title: 'The Year of Chaos', weight: 0.7,
    params: {
      bg: hex(0x120a2a), fogDensity: 0.15,
      light: hex(0xff3fb0), lightIntensity: 3.0, lightHeight: 3,
      ground: hex(0x2a0f4a), walls: 0.7, wallsHeight: 1, wallColor: hex(0x0ff0e0),
      grain: 0, grainSize: 1.0, warmth: 0, saturation: 1.9, contrast: 1.3, vignette: 0.3, blur: 0.3,
      tilt: 0, walkSpeed: 3.0, stillness: 0, speedSensitivity: 1,
      drone: { root: 55, interval: 6, brightness: 1, noise: 0.5, sub: 1, heartbeat: 0, bpm: 140, drive: 1, volume: 0.95 },
    },
  },
  {
    id: '12', title: 'Finding Her', weight: 1.0,
    params: {
      bg: hex(0xc9a27a), fogDensity: 0.2,
      light: hex(0xffe4b8), lightIntensity: 1.4, lightHeight: 3,
      ground: hex(0x8a6a4a), walls: 0.5, wallsHeight: 1, wallColor: hex(0xd8b898),
      grain: 0.2, grainSize: 1.5, warmth: 0.4, saturation: 0.95, contrast: 1.0, vignette: 0.3, blur: 0.05,
      tilt: 0, walkSpeed: 0.7, stillness: 0, speedSensitivity: 0.1,
      drone: { root: 110, interval: 4, brightness: 0.6, noise: 0.2, sub: 0.05, heartbeat: 0, bpm: 0, drive: 0.1, volume: 0.5 },
    },
  },
  {
    id: '13', title: 'Somewhere Between Then and Now', weight: 1.2,
    params: {
      bg: hex(0x6a7a8a), fogDensity: 0.04,
      light: hex(0xffd9a0), lightIntensity: 1.2, lightHeight: 1.0,
      ground: hex(0x5a6570), walls: 0, wallsHeight: 1, wallColor: hex(0x6a7a8a),
      grain: 0.2, grainSize: 2.0, warmth: 0.1, saturation: 0.75, contrast: 0.95, vignette: 0.5, blur: 0.1,
      tilt: 0, walkSpeed: 1.0, stillness: 0, speedSensitivity: 0.05,
      drone: { root: 220, interval: 0, brightness: 0.5, noise: 0.05, sub: 0, heartbeat: 0, bpm: 0, drive: 0, volume: 0.45 },
    },
  },
];

/** Progress at which the final fade to black begins. The horizon holds until here. */
export const FADE_START = 0.96;
