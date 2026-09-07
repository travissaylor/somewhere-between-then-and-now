import { describe, expect, it } from 'vitest';
import { ERAS, FADE_START } from './eras';
import { createTimeline } from './timeline';

describe('timeline', () => {
  const tl = createTimeline(ERAS);

  it('boundaries start at 0, end at 1, and are increasing', () => {
    const b = tl.boundaries();
    expect(b[0]).toBe(0);
    expect(b[b.length - 1]).toBe(1);
    expect(b.length).toBe(ERAS.length + 1);
    for (let i = 1; i < b.length; i++) expect(b[i]).toBeGreaterThan(b[i - 1]);
  });

  it('locates every era at its center with no mix', () => {
    const b = tl.boundaries();
    ERAS.forEach((era, i) => {
      const mid = (b[i] + b[i + 1]) / 2;
      const l = tl.locate(mid);
      expect(l.eraIndex).toBe(i);
      expect(l.mix).toBe(0);
      expect(l.eraA).toBe(i);
      expect(l.eraB).toBe(i);
      expect(tl.paramsAt(mid)).toEqual(era.params);
    });
  });

  it('mixes across a boundary from 0 to 1 with the previous era on the left', () => {
    const b = tl.boundaries();
    const boundary = b[1];
    const before = tl.locate(boundary - 1e-6);
    const after = tl.locate(boundary + 1e-6);
    expect(before.eraIndex).toBe(0);
    expect(after.eraIndex).toBe(1);
    expect(before.eraA).toBe(0);
    expect(before.eraB).toBe(1);
    expect(after.eraA).toBe(0);
    expect(after.eraB).toBe(1);
    expect(before.mix).toBeCloseTo(0.5, 3);
    expect(after.mix).toBeCloseTo(0.5, 3);
  });

  it('is monotonic in walk distance and eraIndex', () => {
    let lastD = -1;
    let lastE = -1;
    for (let i = 0; i <= 1000; i++) {
      const t = i / 1000;
      const d = tl.walkDistanceAt(t);
      expect(d).toBeGreaterThanOrEqual(lastD);
      lastD = d;
      const e = tl.locate(t).eraIndex;
      expect(e).toBeGreaterThanOrEqual(lastE);
      lastE = e;
    }
    expect(tl.walkDistanceAt(0)).toBe(0);
    expect(tl.walkDistanceAt(1)).toBeGreaterThan(0);
  });

  it('fades only in the final stretch', () => {
    expect(tl.fadeAt(0)).toBe(0);
    expect(tl.fadeAt(FADE_START - 0.01)).toBe(0);
    expect(tl.fadeAt(1)).toBe(1);
    expect(tl.fadeAt((FADE_START + 1) / 2)).toBeCloseTo(0.5, 5);
  });

  it('accepts new weights and rebuilds', () => {
    const t2 = createTimeline(ERAS);
    const w = ERAS.map(() => 1);
    t2.setWeights(w);
    const b = t2.boundaries();
    expect(b[1]).toBeCloseTo(1 / ERAS.length, 6);
    expect(() => t2.setWeights([1])).toThrow();
  });
});
