import { describe, it, expect } from 'vitest';
import { computeGainForEra } from '@/audio/audioMath';

describe('computeGainForEra', () => {
  describe('active era (eraIndex === currentEra)', () => {
    it('returns 1.0 for active era past overlap region', () => {
      // eraProgress=0.5 is well past overlapWidth=0.1
      expect(computeGainForEra(5, 5, 0.5, 0.1)).toBe(1.0);
    });

    it('returns 0.5 for active era at mid-overlap (fade-in)', () => {
      // eraProgress=0.05, overlapWidth=0.1 → 0.05/0.1 = 0.5
      expect(computeGainForEra(5, 5, 0.05, 0.1)).toBe(0.5);
    });

    it('returns 0.0 for active era at exact start of overlap (eraProgress=0)', () => {
      // first era, eraProgress=0.0, overlapWidth=0.1 → 0.0/0.1 = 0.0
      expect(computeGainForEra(0, 0, 0.0, 0.1)).toBe(0.0);
    });

    it('returns 1.0 for active era when overlap is exactly complete (eraProgress=overlapWidth)', () => {
      // eraProgress=0.1, overlapWidth=0.1 → 0.1/0.1 = 1.0
      expect(computeGainForEra(0, 0, 0.1, 0.1)).toBe(1.0);
    });

    it('clamps to 1.0 when eraProgress exceeds overlapWidth', () => {
      expect(computeGainForEra(3, 3, 0.9, 0.1)).toBe(1.0);
    });
  });

  describe('previous era (eraIndex === currentEra - 1)', () => {
    it('returns 0.5 for previous era at mid-overlap (fade-out)', () => {
      // eraProgress=0.05, overlapWidth=0.1 → 1 - 0.05/0.1 = 0.5
      expect(computeGainForEra(4, 5, 0.05, 0.1)).toBe(0.5);
    });

    it('returns 0.0 for previous era past overlap region', () => {
      // eraProgress=0.5 is past overlapWidth=0.1 → previous era fully faded out
      expect(computeGainForEra(4, 5, 0.5, 0.1)).toBe(0.0);
    });

    it('returns 1.0 for previous era at exact start (eraProgress=0)', () => {
      // eraProgress=0.0 → 1 - 0.0/0.1 = 1.0
      expect(computeGainForEra(4, 5, 0.0, 0.1)).toBe(1.0);
    });

    it('clamps to 0.0 when previous era fade result would go negative', () => {
      expect(computeGainForEra(4, 5, 0.5, 0.1)).toBeGreaterThanOrEqual(0.0);
      expect(computeGainForEra(4, 5, 0.5, 0.1)).toBeLessThanOrEqual(1.0);
    });
  });

  describe('non-adjacent eras', () => {
    it('returns 0.0 for era two steps back', () => {
      expect(computeGainForEra(3, 5, 0.5, 0.1)).toBe(0.0);
    });

    it('returns 0.0 for era far removed', () => {
      expect(computeGainForEra(0, 12, 0.5, 0.1)).toBe(0.0);
    });

    it('returns 0.0 for future era', () => {
      expect(computeGainForEra(6, 5, 0.5, 0.1)).toBe(0.0);
    });
  });

  describe('overlapWidth=0 edge case (no crossfade)', () => {
    it('returns 1.0 for active era when overlapWidth is 0', () => {
      expect(computeGainForEra(5, 5, 0.0, 0)).toBe(1.0);
    });

    it('returns 0.0 for previous era when overlapWidth is 0', () => {
      expect(computeGainForEra(4, 5, 0.0, 0)).toBe(0.0);
    });

    it('returns 0.0 for non-adjacent era when overlapWidth is 0', () => {
      expect(computeGainForEra(3, 5, 0.0, 0)).toBe(0.0);
    });
  });

  describe('gain clamping', () => {
    it('never returns a value below 0', () => {
      const result = computeGainForEra(4, 5, 0.99, 0.1);
      expect(result).toBeGreaterThanOrEqual(0.0);
    });

    it('never returns a value above 1', () => {
      const result = computeGainForEra(5, 5, 0.99, 0.1);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });
});
