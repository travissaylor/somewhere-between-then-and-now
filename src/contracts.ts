/**
 * Module interfaces. main.ts wires these together; each module directory
 * implements exactly one of them. Do not add cross-module imports beyond
 * `state.ts`, `contracts.ts`, and `timeline/*`.
 */
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { FrameState } from './state';

/** Virtual, forward-only scroll. Owns all input and inertia. */
export interface Scroll {
  /** Current progress 0..1. */
  readonly t: number;
  /** Progress per second, smoothed, never negative. */
  readonly velocity: number;
  /** Start accepting input. Called once when the viewer clicks begin. */
  enable(): void;
  /** Stop accepting input. Called when the piece is over. */
  disable(): void;
  /** Advance inertia by dt seconds. Called once per frame. */
  update(dt: number): void;
  /** Jump to a progress value. Debug and URL-parameter use only. */
  set(t: number): void;
}

export interface ScrollOptions {
  /** Wheel pixels it takes to travel the whole piece. Sets the natural pace. */
  pixelsTotal?: number;
}

/** The one persistent three.js scene: renderer, walking camera, and the six cast objects. */
export interface SceneModule {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  update(state: FrameState): void;
  resize(width: number, height: number): void;
}

/** Fullscreen post pass: grain, color grade, vignette, blur, final fade. Renders the scene to the screen. */
export interface Post {
  render(scene: Scene, camera: PerspectiveCamera, state: FrameState): void;
  resize(width: number, height: number): void;
}

export interface AudioMeters {
  /** 0..1 master level. */
  master: number;
  /** 0..1 level of the era fading out. */
  eraA: number;
  /** 0..1 level of the era fading in. */
  eraB: number;
  /** 0..1 current scroll-driven energy. */
  energy: number;
}

/** Generative Web Audio. Silent until start() is called from a user gesture. */
export interface Audio {
  /** Create and resume the AudioContext. Must be called from a click or key handler. */
  start(): Promise<void>;
  update(state: FrameState): void;
  meters(): AudioMeters;
}

export interface EntryOptions {
  title: string;
  /** True on phone-sized screens: show the "meant for a larger screen" message instead of begin. */
  smallScreen: boolean;
  onBegin(): void;
}

/** Darkness, the title, and the word begin. */
export interface Entry {
  /** Fade the entry away. Called after onBegin. */
  dismiss(): void;
}

/** Black and the title returning at the end. */
export interface Ending {
  update(state: FrameState): void;
}

export interface DebugDeps {
  getState(): FrameState;
  setProgress(t: number): void;
  getWeights(): number[];
  setWeights(weights: number[]): void;
  boundaries(): number[];
  eraTitles(): string[];
  meters(): AudioMeters;
}

/** Dev-only panel. Loaded lazily; never part of the viewer path. */
export interface Debug {
  update(state: FrameState): void;
  toggle(): void;
}
