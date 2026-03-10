import { describe, it, expect } from 'vitest';
import { eraStore } from './eraStore';

describe('eraStore', () => {
  it('has initial state of globalProgress: 0, currentEra: 0, eraProgress: 0', () => {
    const state = eraStore.getState();
    expect(state.globalProgress).toBe(0);
    expect(state.currentEra).toBe(0);
    expect(state.eraProgress).toBe(0);
  });

  it('updates values via setState and reads them back via getState', () => {
    eraStore.setState({ globalProgress: 0.5, currentEra: 6, eraProgress: 0.3 });
    const state = eraStore.getState();
    expect(state.globalProgress).toBe(0.5);
    expect(state.currentEra).toBe(6);
    expect(state.eraProgress).toBe(0.3);
  });

  it('reflects latest values after multiple rapid setState calls', () => {
    eraStore.setState({ globalProgress: 0.1, currentEra: 1, eraProgress: 0.1 });
    eraStore.setState({ globalProgress: 0.2, currentEra: 2, eraProgress: 0.2 });
    eraStore.setState({ globalProgress: 0.9, currentEra: 11, eraProgress: 0.8 });
    const state = eraStore.getState();
    expect(state.globalProgress).toBe(0.9);
    expect(state.currentEra).toBe(11);
    expect(state.eraProgress).toBe(0.8);
  });
});
