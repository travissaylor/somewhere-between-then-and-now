import type { Entry, EntryOptions } from '../contracts';

const MODIFIER_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'Fn',
  'FnLock',
  'Symbol',
  'SymbolLock',
  'Hyper',
  'Super',
  'AltGraph',
]);

/**
 * Creates the fullscreen entry overlay with the title and begin prompt.
 * Fades out and dismisses on user gesture or keypress.
 */
export function createEntry(root: HTMLElement, opts: EntryOptions): Entry {
  const overlay = document.createElement('div');
  overlay.className = 'entry';

  const content = document.createElement('div');
  content.className = 'entry-content';

  const titleEl = document.createElement('h1');
  titleEl.className = 'entry-title';
  titleEl.textContent = opts.title;
  content.appendChild(titleEl);

  let button: HTMLButtonElement | null = null;

  if (opts.smallScreen) {
    const notice = document.createElement('p');
    notice.className = 'entry-notice';
    notice.textContent = 'This piece is meant for a larger screen.';
    content.appendChild(notice);
  } else {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'entry-begin';
    button.textContent = 'begin';
    content.appendChild(button);
  }

  overlay.appendChild(content);
  root.appendChild(overlay);

  let started = false;
  let dismissed = false;

  function triggerBegin() {
    if (started) return;
    started = true;
    window.removeEventListener('keydown', handleKeydown);
    overlay.removeEventListener('click', handleClick);
    opts.onBegin();
  }

  function handleClick() {
    triggerBegin();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.repeat) return;
    if (MODIFIER_KEYS.has(e.key) || e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }
    triggerBegin();
  }

  if (!opts.smallScreen) {
    overlay.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeydown);
    if (button) {
      button.focus();
    }
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    window.removeEventListener('keydown', handleKeydown);
    overlay.removeEventListener('click', handleClick);

    overlay.classList.add('dismissing');

    const reducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const durationMs = reducedMotion ? 400 : 2500;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      overlay.removeEventListener('transitionend', onTransitionEnd);
      overlay.remove();
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === overlay && e.propertyName === 'opacity') {
        cleanup();
      }
    };

    overlay.addEventListener('transitionend', onTransitionEnd);
    setTimeout(cleanup, durationMs);
  }

  return { dismiss };
}
