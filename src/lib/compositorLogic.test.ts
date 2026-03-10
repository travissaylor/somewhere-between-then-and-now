import { describe, it, expect } from 'vitest';
import {
  getScenePair,
  computeBlendFactor,
  getOverlapRegion,
} from './compositorLogic';

describe('compositorLogic', () => {
  describe('computeBlendFactor', () => {
    it('returns 0 when eraProgress is below overlap threshold (0.5 with 10% overlap)', () => {
      expect(computeBlendFactor(0.5, 0.1)).toBe(0);
    });

    it('returns 0 when eraProgress is 0', () => {
      expect(computeBlendFactor(0.0, 0.1)).toBe(0);
    });

    it('returns 1 when eraProgress is 1.0', () => {
      expect(computeBlendFactor(1.0, 0.1)).toBe(1);
    });

    it('returns 0 at start of overlap region (eraProgress=0.9, overlapFraction=0.1)', () => {
      expect(computeBlendFactor(0.9, 0.1)).toBe(0);
    });

    it('returns 0.5 at midpoint of overlap region (eraProgress=0.95, overlapFraction=0.1)', () => {
      const result = computeBlendFactor(0.95, 0.1);
      expect(result).toBeCloseTo(0.5, 5);
    });

    it('ramps linearly through the overlap region (0.9 to 1.0 for 10% overlap)', () => {
      const atStart = computeBlendFactor(0.9, 0.1);   // 0
      const atMid   = computeBlendFactor(0.95, 0.1);  // 0.5
      const atEnd   = computeBlendFactor(1.0, 0.1);   // 1.0
      expect(atStart).toBe(0);
      expect(atMid).toBeCloseTo(0.5, 5);
      expect(atEnd).toBe(1);
    });

    it('uses default overlapFraction of 0.1 when not provided', () => {
      // same behavior as explicitly passing 0.1
      expect(computeBlendFactor(0.5)).toBe(0);
      expect(computeBlendFactor(1.0)).toBe(1);
    });
  });

  describe('getOverlapRegion', () => {
    it('returns default 0.1 for any era boundary', () => {
      expect(getOverlapRegion(0)).toBe(0.1);
      expect(getOverlapRegion(5)).toBe(0.1);
      expect(getOverlapRegion(11)).toBe(0.1);
    });
  });

  describe('getScenePair', () => {
    it('returns fromEra=0, toEra=1 at era 0 with progress 0.5 (mid-era, no blend)', () => {
      const result = getScenePair(0, 0.5);
      expect(result.fromEra).toBe(0);
      expect(result.toEra).toBe(1);
      expect(result.blend).toBe(0);
    });

    it('returns blend=0 at era start (eraProgress=0.0)', () => {
      const result = getScenePair(5, 0.0);
      expect(result.fromEra).toBe(5);
      expect(result.toEra).toBe(6);
      expect(result.blend).toBe(0);
    });

    it('returns fromEra=12, toEra=12, blend=0 at last era (no next era)', () => {
      const result = getScenePair(12, 0.5);
      expect(result.fromEra).toBe(12);
      expect(result.toEra).toBe(12);
      expect(result.blend).toBe(0);
    });

    it('returns blend=0 even at eraProgress=1.0 for last era (era 12)', () => {
      const result = getScenePair(12, 1.0);
      expect(result.fromEra).toBe(12);
      expect(result.toEra).toBe(12);
      expect(result.blend).toBe(0);
    });

    it('returns blend>0 when eraProgress enters overlap region (eraProgress=0.95)', () => {
      const result = getScenePair(3, 0.95);
      expect(result.fromEra).toBe(3);
      expect(result.toEra).toBe(4);
      expect(result.blend).toBeGreaterThan(0);
      expect(result.blend).toBeLessThan(1);
    });

    it('returns blend=1 when eraProgress=1.0 for a non-last era', () => {
      const result = getScenePair(0, 1.0);
      expect(result.fromEra).toBe(0);
      expect(result.toEra).toBe(1);
      expect(result.blend).toBe(1);
    });
  });
});
