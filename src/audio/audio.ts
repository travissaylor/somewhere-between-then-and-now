import type { Audio, AudioMeters } from '../contracts';
import type { DroneParams, FrameState } from '../state';
import { ERAS } from '../timeline/eras';

const MASTER_LEVEL = 0.8;
const MASTER_FADE_SECONDS = 1.5;
const LEVEL_TC = 0.1;
const PARAM_TC = 0.05;
const GAIN_EPS = 0.001;
const FREQ_EPS = 1;
const ENERGY_ATTACK = 0.15;
const ENERGY_RELEASE = 0.8;
const NOISE_BUFFER_SECONDS = 2;
const HEARTBEAT_SCHEDULE_MS = 50;
const HEARTBEAT_LOOKAHEAD = 0.15;

/** One always-running voice built from a single era's DroneParams. */
interface Voice {
  drone: DroneParams;
  output: GainNode;
  toneFilter: BiquadFilterNode;
  noiseGain: GainNode;
  toneBaseFreq: number;
  noiseBaseFreq: number;
  lastOutputGain: number;
  lastToneFreq: number;
  lastNoiseGain: number;
}

/** A 2s mono white-noise buffer, built once and shared by every voice's looping source. */
function buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * NOISE_BUFFER_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Schedules a two-hit "lub-dub" heartbeat for a voice while it stays audible. */
function startHeartbeat(ctx: AudioContext, voice: Voice): void {
  const beatSeconds = 60 / voice.drone.bpm;
  let nextBeat = ctx.currentTime + 0.1;
  window.setInterval(() => {
    if (voice.lastOutputGain <= GAIN_EPS) {
      // Not audible: skip work, but keep the schedule from drifting far behind.
      nextBeat = Math.max(nextBeat, ctx.currentTime);
      return;
    }
    while (nextBeat < ctx.currentTime + HEARTBEAT_LOOKAHEAD) {
      fireHeartbeat(ctx, voice, nextBeat);
      nextBeat += beatSeconds;
    }
  }, HEARTBEAT_SCHEDULE_MS);
}

function fireHeartbeat(ctx: AudioContext, voice: Voice, time: number): void {
  const level = voice.drone.heartbeat * 0.9;
  fireBeatHit(ctx, voice, time, level);
  fireBeatHit(ctx, voice, time + 0.18, level * 0.7);
}

function fireBeatHit(ctx: AudioContext, voice: Voice, time: number, peak: number): void {
  if (peak <= 0) return;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 50;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(peak, time + 0.005);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.001), time + 0.005 + 0.12);
  osc.connect(env).connect(voice.output);
  osc.start(time);
  osc.stop(time + 0.2);
}

/** Builds one always-running voice for an era: root, interval, sub, noise, tone filter, heartbeat, drive pulse. */
function buildVoice(ctx: AudioContext, master: GainNode, noiseBuffer: AudioBuffer, drone: DroneParams, index: number): Voice {
  const output = ctx.createGain();
  output.gain.value = 0;
  output.connect(master);

  // Tone bus: root sine + root triangle + a detuned sine for width, plus the interval voice.
  const toneSum = ctx.createGain();
  toneSum.gain.value = 1;

  const rootSine = ctx.createOscillator();
  rootSine.type = 'sine';
  rootSine.frequency.value = drone.root;
  rootSine.connect(toneSum);
  rootSine.start();

  const rootTriangle = ctx.createOscillator();
  rootTriangle.type = 'triangle';
  rootTriangle.frequency.value = drone.root;
  const rootTriangleGain = ctx.createGain();
  rootTriangleGain.gain.value = 0.4;
  rootTriangle.connect(rootTriangleGain).connect(toneSum);
  rootTriangle.start();

  const rootWide = ctx.createOscillator();
  rootWide.type = 'sine';
  rootWide.frequency.value = drone.root;
  rootWide.detune.value = 6;
  const rootWideGain = ctx.createGain();
  rootWideGain.gain.value = 0.5;
  rootWide.connect(rootWideGain).connect(toneSum);
  rootWide.start();

  if (drone.interval !== 0) {
    const interval = ctx.createOscillator();
    interval.type = 'sine';
    interval.frequency.value = drone.root * Math.pow(2, drone.interval / 12);
    const intervalGain = ctx.createGain();
    intervalGain.gain.value = 0.5;
    interval.connect(intervalGain).connect(toneSum);
    interval.start();
  }

  const toneBaseFreq = 300 + drone.brightness * 4000;
  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = toneBaseFreq;
  toneSum.connect(toneFilter);

  // Drive pulse: an amplitude LFO on the tone bus at bpm/60 Hz.
  const pulseGain = ctx.createGain();
  pulseGain.gain.value = 1;
  toneFilter.connect(pulseGain);
  pulseGain.connect(output);
  if (drone.drive > 0 && drone.bpm > 0) {
    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = drone.bpm / 60;
    const pulseDepth = ctx.createGain();
    pulseDepth.gain.value = drone.drive * 0.35;
    pulseLfo.connect(pulseDepth).connect(pulseGain.gain);
    pulseLfo.start();
  }

  // Sub: one octave below root, bypassing the tone filter.
  if (drone.sub > 0) {
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = drone.root / 2;
    const subGain = ctx.createGain();
    subGain.gain.value = drone.sub * 0.6;
    sub.connect(subGain).connect(output);
    sub.start();
  }

  // Noise: a shared looping buffer through a lowpass with a slow wandering LFO.
  const noiseBaseFreq = 200 + drone.brightness * 6000;
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = noiseBaseFreq;
  const noiseLfo = ctx.createOscillator();
  noiseLfo.type = 'sine';
  noiseLfo.frequency.value = 0.05 + (index % 4) * 0.05;
  const noiseLfoDepth = ctx.createGain();
  noiseLfoDepth.gain.value = noiseBaseFreq * 0.2;
  noiseLfo.connect(noiseLfoDepth).connect(noiseFilter.frequency);
  noiseLfo.start();
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = drone.noise * 0.25;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(output);
  noiseSource.start();

  const voice: Voice = {
    drone, output, toneFilter, noiseGain,
    toneBaseFreq, noiseBaseFreq,
    lastOutputGain: 0, lastToneFreq: toneBaseFreq, lastNoiseGain: drone.noise * 0.25,
  };

  if (drone.heartbeat > 0 && drone.bpm > 0) startHeartbeat(ctx, voice);

  return voice;
}

/** Generative Web Audio: thirteen always-running era voices crossfaded by scroll position and speed. */
export function createAudio(): Audio {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let masterTarget = 0;
  let voices: Voice[] = [];
  let energy = 0;
  let started = false;

  const meters: AudioMeters = { master: 0, eraA: 0, eraB: 0, energy: 0 };

  document.addEventListener('visibilitychange', () => {
    // Nothing fancy: just don't throw if the browser suspends audio in the background.
  });

  async function start(): Promise<void> {
    if (started) return;
    ctx = new AudioContext();
    await ctx.resume();

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    compressor.connect(ctx.destination);

    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(compressor);

    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(MASTER_LEVEL, now + MASTER_FADE_SECONDS);
    masterTarget = MASTER_LEVEL;

    const noiseBuffer = buildNoiseBuffer(ctx);
    voices = ERAS.map((era, i) => buildVoice(ctx as AudioContext, masterGain as GainNode, noiseBuffer, era.params.drone, i));

    started = true;
  }

  function update(state: FrameState): void {
    if (!started || !ctx) return;
    const now = ctx.currentTime;

    const energyTarget = state.speed * state.params.speedSensitivity;
    const tc = energyTarget > energy ? ENERGY_ATTACK : ENERGY_RELEASE;
    const alpha = 1 - Math.exp(-state.dt / tc);
    energy += (energyTarget - energy) * alpha;
    if (energy < 1e-6) energy = 0;

    for (let i = 0; i < voices.length; i++) {
      const voice = voices[i];
      let weight = 0;
      if (i === state.eraA) weight += 1 - state.mix;
      if (i === state.eraB) weight += state.mix;

      const targetOutputGain = voice.drone.volume * weight * (1 + energy * 0.8);
      if (Math.abs(targetOutputGain - voice.lastOutputGain) > GAIN_EPS) {
        voice.output.gain.setTargetAtTime(targetOutputGain, now, LEVEL_TC);
        voice.lastOutputGain = targetOutputGain;
      }

      const targetToneFreq = voice.toneBaseFreq + 1500 * energy;
      if (Math.abs(targetToneFreq - voice.lastToneFreq) > FREQ_EPS) {
        voice.toneFilter.frequency.setTargetAtTime(targetToneFreq, now, PARAM_TC);
        voice.lastToneFreq = targetToneFreq;
      }

      const targetNoiseGain = voice.drone.noise * 0.25 * (1 + 0.5 * energy);
      if (Math.abs(targetNoiseGain - voice.lastNoiseGain) > GAIN_EPS) {
        voice.noiseGain.gain.setTargetAtTime(targetNoiseGain, now, LEVEL_TC);
        voice.lastNoiseGain = targetNoiseGain;
      }

      if (i === state.eraA) meters.eraA = voice.lastOutputGain;
      if (i === state.eraB) meters.eraB = voice.lastOutputGain;
    }

    meters.master = masterTarget;
    meters.energy = energy;
  }

  return {
    start,
    update,
    meters: () => meters,
  };
}
