import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export interface EraState {
  globalProgress: number;   // 0-1 across entire scroll
  currentEra: number;       // 0-12 integer
  eraProgress: number;      // 0-1 within current era
}

// Vanilla store - accessible outside React (e.g., useFrame, GSAP callbacks)
export const eraStore = createStore<EraState>(() => ({
  globalProgress: 0,
  currentEra: 0,
  eraProgress: 0,
}));

// React hook bridge for components that need reactive updates
// Usage: const progress = useEraStore(s => s.globalProgress)
export const useEraStore = <T>(selector: (state: EraState) => T): T =>
  useStore(eraStore, selector);
