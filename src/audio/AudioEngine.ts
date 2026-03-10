/**
 * Tone.js audio engine singleton.
 *
 * Manages 13 audio stems (one per era) with scroll-reactive gain crossfading.
 * All Tone.js construction happens in init() — never at module scope — to prevent
 * SSR crashes in Next.js.
 *
 * Requirements satisfied:
 * - AUDO-01: Gesture gate — audio only starts after first user interaction / scroll enable
 * - AUDO-03: Smooth gain transitions via rampTo(target, 0.05), never direct .value
 * - AUDO-05: Tab visibility — suspend on hidden, resume on visible
 * - AUDO-06: Graceful fallback — missing stems log a warning and produce silence
 */

import * as Tone from 'tone';
import { computeGainForEra, type AudioZoneConfig } from '@/audio/audioMath';
import { AUDIO_ZONES } from '@/audio/audioZones';

export class AudioEngine {
  /** One player per era slot (null if stem failed to load — AUDO-06 graceful fallback) */
  private players: (Tone.Player | null)[] = [];
  /** One gain node per era slot, each connected directly to Tone.Destination */
  private gains: Tone.Gain[] = [];
  /** Whether Tone.start() has been called and players are running */
  private started: boolean = false;
  /** Whether dispose() has been called — prevents double-dispose crashes */
  private disposed: boolean = false;

  /**
   * Initialise the Tone.js audio graph.
   *
   * Creates 13 gain nodes connected to the master destination, loads each stem
   * asynchronously with graceful fallback, and registers the tab-visibility listener.
   *
   * Call from useEffect only — never at module or render scope.
   */
  async init(): Promise<void> {
    // Create gain nodes and connect to master output
    for (let i = 0; i < AUDIO_ZONES.length; i++) {
      const gain = new Tone.Gain(0);
      gain.toDestination();
      this.gains[i] = gain;
    }

    // Load stems concurrently — failures are caught inside loadStem (AUDO-06)
    await Promise.all(
      AUDIO_ZONES.map((zone) => this.loadStem(zone, this.gains[zone.eraIndex]))
    );

    // Tab visibility handler (AUDO-05)
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  /**
   * Start all loaded players.
   *
   * Must be called in response to a user gesture (or after isScrollEnabled becomes true).
   * Safe to call multiple times — no-ops after first successful start (AUDO-01).
   */
  async start(): Promise<void> {
    if (this.started || this.disposed) return;

    // Tone.start() must be called from a user-gesture context (or from isScrollEnabled
    // which is itself gated on the womb-gate interaction).
    await Tone.start();

    // Start all successfully-loaded players looping
    for (const player of this.players) {
      if (player !== null) {
        player.start();
      }
    }

    this.started = true;
  }

  /**
   * Update the gain mix based on current scroll position.
   *
   * Only processes the three eras that can have non-zero gain:
   * the previous era (currentEra - 1), the current era, and the next era
   * (though next-era gain is always 0 per computeGainForEra logic, it is
   * included for correctness when the user scrolls rapidly backwards).
   *
   * All other era gains are already 0 and are not updated for efficiency.
   */
  updateMix(currentEra: number, eraProgress: number): void {
    // Only the window [currentEra-1, currentEra+1] can have non-zero gain
    const startIdx = Math.max(0, currentEra - 1);
    const endIdx = Math.min(AUDIO_ZONES.length - 1, currentEra + 1);

    for (let i = 0; i < AUDIO_ZONES.length; i++) {
      const gain = this.gains[i];
      if (!gain) continue;

      const zone = AUDIO_ZONES[i];
      const isInWindow = i >= startIdx && i <= endIdx;

      if (isInWindow) {
        const target = computeGainForEra(
          zone.eraIndex,
          currentEra,
          eraProgress,
          zone.overlapWidth
        );
        // AUDO-03: always rampTo, never direct .value assignment
        gain.gain.rampTo(target, 0.05);
      } else {
        // Outside active window — ensure silent (ramp quickly to avoid pops if needed)
        gain.gain.rampTo(0, 0.05);
      }
    }
  }

  /**
   * Load a single audio stem and connect it to its gain node.
   *
   * On failure (404, network error, etc.) logs a warning and stores null so
   * the experience continues silently for that era (AUDO-06).
   */
  private async loadStem(
    zone: AudioZoneConfig,
    gain: Tone.Gain
  ): Promise<void> {
    const player = new Tone.Player({ loop: true });
    try {
      await player.load(zone.stemUrl);
      player.connect(gain);
      this.players[zone.eraIndex] = player;
    } catch {
      console.warn(
        `[AudioEngine] Failed to load stem for era ${zone.eraIndex}: ${zone.stemUrl} — era will play silently.`
      );
      player.dispose();
      this.players[zone.eraIndex] = null;
    }
  }

  /**
   * Tab visibility handler (AUDO-05).
   *
   * Suspends the AudioContext when the tab is hidden; resumes it when visible.
   * Does NOT call player.start() on resume — players are already running and
   * resuming the AudioContext restores their position without a jump.
   */
  private handleVisibility = (): void => {
    const ctx = Tone.getContext().rawContext as AudioContext;
    if (document.hidden) {
      ctx.suspend();
    } else if (this.started) {
      ctx.resume();
    }
  };

  /**
   * Clean up all Tone.js nodes and DOM listeners.
   *
   * Safe to call on component unmount. Idempotent after first call.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    document.removeEventListener('visibilitychange', this.handleVisibility);

    for (const player of this.players) {
      player?.dispose();
    }
    for (const gain of this.gains) {
      gain?.dispose();
    }

    this.players = [];
    this.gains = [];
  }
}

/**
 * Factory function for AudioEngine.
 *
 * Returns a new AudioEngine instance without calling init().
 * Caller (AudioProvider useEffect) is responsible for calling init().
 */
export function createAudioEngine(): AudioEngine {
  return new AudioEngine();
}
