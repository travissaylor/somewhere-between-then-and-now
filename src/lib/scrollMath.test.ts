import { describe, it, expect } from 'vitest';
import { computeEraProgress, computeScrollHeight, eraBoundaries } from './scrollMath';
import { ERA_CONFIG } from '@/config/eras';

describe('computeEraProgress', () => {
  it('returns era 0, eraProgress 0 at globalProgress 0', () => {
    const result = computeEraProgress(0);
    expect(result.currentEra).toBe(0);
    expect(result.eraProgress).toBe(0);
  });

  it('returns era 12, eraProgress ~1 at globalProgress 1', () => {
    const result = computeEraProgress(1);
    expect(result.currentEra).toBe(12);
    expect(result.eraProgress).toBeCloseTo(1, 5);
  });

  it('returns a valid era and progress at globalProgress 0.5', () => {
    const result = computeEraProgress(0.5);
    expect(result.currentEra).toBeGreaterThanOrEqual(0);
    expect(result.currentEra).toBeLessThanOrEqual(12);
    expect(result.eraProgress).toBeGreaterThanOrEqual(0);
    expect(result.eraProgress).toBeLessThanOrEqual(1);
  });

  it('clamps negative input to era 0, progress 0', () => {
    const result = computeEraProgress(-0.1);
    expect(result.currentEra).toBe(0);
    expect(result.eraProgress).toBe(0);
  });

  it('clamps input above 1 to era 12, progress 1', () => {
    const result = computeEraProgress(1.5);
    expect(result.currentEra).toBe(12);
    expect(result.eraProgress).toBeCloseTo(1, 5);
  });

  it('has era boundaries that sum to approximately 1.0', () => {
    const lastBoundary = eraBoundaries[eraBoundaries.length - 1];
    expect(lastBoundary.end).toBeCloseTo(1.0, 10);
  });

  it('gives Era 8 (The Breakup, weight 3.0) more scroll distance than Era 10 (Year of Chaos, weight 0.5)', () => {
    const breakupSpan = eraBoundaries[8].end - eraBoundaries[8].start;
    const chaosSpan = eraBoundaries[10].end - eraBoundaries[10].start;
    expect(breakupSpan).toBeGreaterThan(chaosSpan);
  });

  it('makes all 13 eras reachable by sweeping progress 0 to 1', () => {
    const reachedEras = new Set<number>();
    const steps = 1000;
    for (let i = 0; i <= steps; i++) {
      const { currentEra } = computeEraProgress(i / steps);
      reachedEras.add(currentEra);
    }
    for (let era = 0; era <= 12; era++) {
      expect(reachedEras.has(era)).toBe(true);
    }
  });
});

describe('computeScrollHeight', () => {
  it('returns a positive number', () => {
    expect(computeScrollHeight()).toBeGreaterThan(0);
  });

  it('accepts a custom baseVh parameter', () => {
    const height = computeScrollHeight(1000);
    expect(height).toBeGreaterThan(0);
  });
});

describe('eraBoundaries', () => {
  it('has 13 entries matching ERA_CONFIG length', () => {
    expect(eraBoundaries.length).toBe(ERA_CONFIG.length);
  });
});
