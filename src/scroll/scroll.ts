import type { Scroll, ScrollOptions } from '../contracts';

/** STUB. Replaced by the scroll unit. */
export function createScroll(_target: HTMLElement, _opts: ScrollOptions = {}): Scroll {
  let t = 0;
  return {
    get t() { return t; },
    get velocity() { return 0; },
    enable() {},
    disable() {},
    update() {},
    set(v) { t = Math.min(1, Math.max(0, v)); },
  };
}
