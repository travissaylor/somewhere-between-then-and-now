import { createScroll } from './scroll/scroll';
import { createScene } from './scene/scene';
import { createPost } from './post/post';
import { createAudio } from './audio/audio';
import { createEntry } from './ui/entry';
import { createEnding } from './ui/ending';
import { ERAS } from './timeline/eras';
import { createTimeline } from './timeline/timeline';
import { FAST_SPEED, type FrameState, type Phase } from './state';
import type { Debug } from './contracts';

const TITLE = 'Somewhere Between Then and Now';
const SMALL_SCREEN = window.innerWidth < 768 || (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024);

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;
const params = new URLSearchParams(location.search);
const debugEnabled = import.meta.env.DEV || params.has('debug');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const timeline = createTimeline(ERAS);
const scroll = createScroll(document.body);
const sceneModule = createScene(canvas);
const post = createPost(sceneModule.renderer);
const audio = createAudio();
const ending = createEnding(uiRoot, { title: TITLE });
let debug: Debug | null = null;

let phase: Phase = 'entry';
let beganAt = 0;
let last = performance.now();
const startedAt = last;

const state: FrameState = {
  t: 0, velocity: 0, speed: 0,
  eraIndex: 0, eraT: 0, eraA: 0, eraB: 0, mix: 0,
  params: timeline.paramsAt(0),
  walkDistance: 0, fade: 0, sinceBegin: 0, dt: 0, elapsed: 0,
  phase, reducedMotion,
};

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  sceneModule.resize(w, h);
  post.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

function begin() {
  if (phase !== 'entry') return;
  phase = 'walking';
  beganAt = performance.now();
  void audio.start();
  scroll.enable();
  entry.dismiss();
}

const entry = createEntry(uiRoot, { title: TITLE, smallScreen: SMALL_SCREEN, onBegin: begin });

function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  scroll.update(dt);
  const t = scroll.t;
  const l = timeline.locate(t);

  state.t = t;
  state.velocity = scroll.velocity;
  state.speed = Math.min(1, scroll.velocity / FAST_SPEED);
  state.eraIndex = l.eraIndex;
  state.eraT = l.eraT;
  state.eraA = l.eraA;
  state.eraB = l.eraB;
  state.mix = l.mix;
  state.params = timeline.paramsAt(t);
  state.walkDistance = timeline.walkDistanceAt(t);
  state.fade = timeline.fadeAt(t);
  state.sinceBegin = phase === 'entry' ? 0 : (now - beganAt) / 1000;
  state.dt = dt;
  state.elapsed = (now - startedAt) / 1000;
  if (phase === 'walking' && t >= 1) {
    phase = 'over';
    scroll.disable();
  }
  state.phase = phase;

  sceneModule.update(state);
  post.render(sceneModule.scene, sceneModule.camera, state);
  audio.update(state);
  ending.update(state);
  debug?.update(state);

  requestAnimationFrame(frame);
}

if (debugEnabled) {
  void import('./ui/debug').then(({ createDebug }) => {
    debug = createDebug(uiRoot, {
      getState: () => state,
      setProgress: (v) => scroll.set(v),
      getWeights: () => timeline.getWeights(),
      setWeights: (w) => timeline.setWeights(w),
      boundaries: () => timeline.boundaries(),
      eraTitles: () => ERAS.map((e) => `${e.id} ${e.title}`),
      meters: () => audio.meters(),
    });
    const jump = params.get('t');
    if (jump !== null) {
      // Land at a progress value for screenshots. Skips the entry; audio stays silent without a gesture.
      begin();
      scroll.set(Number(jump));
    }
  });
}

requestAnimationFrame(frame);
