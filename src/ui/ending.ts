import type { Ending } from '../contracts';
import type { FrameState } from '../state';

/**
 * Fullscreen black overlay that fades in when the piece reaches the 'over' phase.
 * The title appears over ~3 seconds total.
 */
export function createEnding(root: HTMLElement, opts: { title: string }): Ending {
  const overlay = document.createElement('div');
  overlay.className = 'ending';

  const titleEl = document.createElement('h1');
  titleEl.className = 'ending-title';
  titleEl.textContent = opts.title;

  overlay.appendChild(titleEl);
  root.appendChild(overlay);

  let shown = false;

  return {
    update(state: FrameState) {
      if (!shown && state.phase === 'over') {
        shown = true;
        overlay.classList.add('visible');
      }
    },
  };
}
