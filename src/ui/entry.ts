import type { Entry, EntryOptions } from '../contracts';

/** STUB. Replaced by the ui unit. */
export function createEntry(root: HTMLElement, opts: EntryOptions): Entry {
  const el = document.createElement('div');
  el.textContent = opts.smallScreen ? 'meant for a larger screen' : `${opts.title} — begin`;
  root.appendChild(el);
  if (!opts.smallScreen) el.addEventListener('click', () => opts.onBegin(), { once: true });
  return { dismiss: () => el.remove() };
}
