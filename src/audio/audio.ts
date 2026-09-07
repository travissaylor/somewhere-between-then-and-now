import type { Audio, AudioMeters } from '../contracts';
import type { FrameState } from '../state';

/** STUB. Replaced by the audio unit. */
export function createAudio(): Audio {
  const meters: AudioMeters = { master: 0, eraA: 0, eraB: 0, energy: 0 };
  return {
    async start() {},
    update(_state: FrameState) {},
    meters: () => meters,
  };
}
