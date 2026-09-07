import type { Scroll, ScrollOptions } from '../contracts';

/** Turns forward input into progress with a short, frame-independent glide. */
export function createScroll(_target: HTMLElement, opts: ScrollOptions = {}): Scroll {
  const requestedTotal = opts.pixelsTotal ?? 90000;
  const pixelsTotal = Number.isFinite(requestedTotal) && requestedTotal > 0
    ? requestedTotal
    : 90000;
  let enabled = false;
  let targetPixels = 0;
  let current = 0;
  let velocity = 0;
  let touchId: number | null = null;
  let lastY = 0;

  function ignored(event: Event): boolean {
    const node = event.target;
    const element = node instanceof Element
      ? node
      : node instanceof Node ? node.parentElement : null;
    return element?.closest('[data-scroll-ignore]') != null;
  }

  function advance(pixels: number): void {
    if (!(pixels > 0)) return;
    targetPixels = Math.min(pixelsTotal, targetPixels + Math.min(600, pixels));
  }

  function onWheel(event: WheelEvent): void {
    if (!enabled || ignored(event)) return;
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    advance(event.deltaY * scale);
  }

  function onTouchStart(event: TouchEvent): void {
    if (!enabled || ignored(event) || touchId !== null) return;
    const finger = event.changedTouches[0];
    if (!finger) return;
    touchId = finger.identifier;
    lastY = finger.clientY;
  }

  function onTouchMove(event: TouchEvent): void {
    if (!enabled || ignored(event)) return;
    event.preventDefault();
    for (let i = 0; i < event.touches.length; i++) {
      const finger = event.touches[i];
      if (finger.identifier !== touchId) continue;
      advance(lastY - finger.clientY);
      lastY = finger.clientY;
      break;
    }
  }

  function onTouchEnd(event: TouchEvent): void {
    if (!enabled || ignored(event)) return;
    for (let i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === touchId) {
        touchId = null;
        break;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!enabled || ignored(event)) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      advance(120);
    } else if (event.key === 'PageDown' || event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      advance(window.innerHeight * 0.8);
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown, { passive: false });

  return {
    get t() { return current; },
    get velocity() { return velocity; },
    enable() { enabled = true; },
    disable() {
      enabled = false;
      touchId = null;
    },
    update(dt) {
      if (!(dt > 0) || !Number.isFinite(dt)) return;
      const target = Math.max(current, targetPixels / pixelsTotal);
      const previous = current;
      current += (target - current) * (1 - Math.exp(-dt / 0.12));
      // Finish the asymptotic glide so main can enter the ending at exactly 1.
      if (target - current < 1e-10) current = target;
      const rate = Math.max(0, (current - previous) / dt);
      velocity += (rate - velocity) * (1 - Math.exp(-dt / 0.1));
      if (velocity < 1e-10) velocity = 0;
    },
    set(v) {
      current = Number.isNaN(v) ? 0 : Math.min(1, Math.max(0, v));
      targetPixels = current * pixelsTotal;
      velocity = 0;
    },
  };
}
