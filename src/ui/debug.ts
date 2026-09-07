import type { Debug, DebugDeps } from '../contracts';
import type { FrameState } from '../state';

/** STUB. Replaced by the ui unit. */
export function createDebug(_root: HTMLElement, _deps: DebugDeps): Debug {
  return { update(_state: FrameState) {}, toggle() {} };
}
