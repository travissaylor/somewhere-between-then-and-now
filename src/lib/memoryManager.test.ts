import { describe, it, expect } from 'vitest';
import { getMemoryPlan } from './memoryManager';

describe('memoryManager', () => {
  describe('getMemoryPlan', () => {
    it('returns correct visible/preload/dispose when currentEra=5, keepAlive=3', () => {
      const plan = getMemoryPlan(5, 3);
      expect(plan.visible.sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8]);
      expect(plan.preload).toEqual([9]);
      expect(plan.dispose).toEqual([]);
    });

    it('returns correct visible/preload when currentEra=0, keepAlive=3 (clamped at lower bound)', () => {
      const plan = getMemoryPlan(0, 3);
      expect(plan.visible.sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
      expect(plan.preload).toEqual([4]);
      expect(plan.dispose).toEqual([]);
    });

    it('returns correct visible/preload when currentEra=12, keepAlive=2 (clamped at upper bound)', () => {
      const plan = getMemoryPlan(12, 2);
      expect(plan.visible.sort((a, b) => a - b)).toEqual([10, 11, 12]);
      expect(plan.preload).toEqual([]);
      expect(plan.dispose).toEqual([]);
    });

    it('returns correct tighter window when currentEra=5, keepAlive=1', () => {
      const plan = getMemoryPlan(5, 1);
      expect(plan.visible.sort((a, b) => a - b)).toEqual([4, 5, 6]);
      expect(plan.preload).toEqual([7]);
      expect(plan.dispose).toEqual([]);
    });

    it('includes dispose list when loadedEras provided outside keep-alive window', () => {
      // currentEra=5, keepAlive=3 → visible=[2..8], preload=[9]
      // loaded: 0,1 are outside window → dispose
      const loadedEras = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      const plan = getMemoryPlan(5, 3, loadedEras);
      expect(plan.dispose.sort((a, b) => a - b)).toEqual([0, 1]);
    });

    it('does not include eras in dispose that are not loaded', () => {
      // currentEra=5, keepAlive=1 → visible=[4,5,6], preload=[7]
      // only era 4,5,6 are loaded — nothing to dispose
      const loadedEras = new Set([4, 5, 6]);
      const plan = getMemoryPlan(5, 1, loadedEras);
      expect(plan.dispose).toEqual([]);
    });

    it('disposes multiple eras outside keep-alive window when currentEra=12, keepAlive=2', () => {
      // visible=[10,11,12], all 0-9 should be disposed if loaded
      const loadedEras = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const plan = getMemoryPlan(12, 2, loadedEras);
      expect(plan.dispose.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('preload points to era N+keepAlive+1 (one beyond visible window)', () => {
      // currentEra=3, keepAlive=2 → visible=[1,2,3,4,5], preload=[6]
      const plan = getMemoryPlan(3, 2);
      expect(plan.preload).toEqual([6]);
    });

    it('has no preload when next era beyond window does not exist', () => {
      // currentEra=11, keepAlive=2 → visible=[9,10,11,12], preload=[13] → clamped, none
      const plan = getMemoryPlan(11, 2);
      expect(plan.preload).toEqual([]);
    });
  });
});
