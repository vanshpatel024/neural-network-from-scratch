import { describe, it, expect } from 'vitest';
import {
  CONVEX_1D,
  NON_CONVEX_1D,
  ELONGATED_BOWL_2D,
  NON_CONVEX_2D,
  step1D,
  detectOscillation1D,
  step2D,
  centeredDifference1D,
  centeredDifference2D,
} from './optim';

describe('1D Optimization Functions', () => {
  it('computes exact analytic derivative matching centered finite difference for CONVEX_1D', () => {
    const testPoints = [-2.5, -1.0, 0.0, 0.75, 2.0];
    for (const x of testPoints) {
      const analytic = CONVEX_1D.df(x);
      const numerical = centeredDifference1D(CONVEX_1D.f, x);
      expect(analytic).toBeCloseTo(numerical, 4);
    }
  });

  it('computes exact analytic derivative matching centered finite difference for NON_CONVEX_1D', () => {
    const testPoints = [-2.0, -1.45, -0.2, 0.05, 1.39, 2.1];
    for (const x of testPoints) {
      const analytic = NON_CONVEX_1D.df(x);
      const numerical = centeredDifference1D(NON_CONVEX_1D.f, x);
      expect(analytic).toBeCloseTo(numerical, 4);
    }
  });

  it('converges smoothly toward zero on CONVEX_1D with a good learning rate', () => {
    let currentX = 2.5;
    const lr = 0.2; // 1 - 2*0.2 = 0.6 factor per step
    for (let i = 0; i < 15; i++) {
      const res = step1D(currentX, lr, CONVEX_1D);
      expect(res.diverged).toBe(false);
      expect(res.loss).toBeLessThanOrEqual(CONVEX_1D.f(currentX) + 1e-6);
      currentX = res.x;
    }
    expect(Math.abs(currentX)).toBeLessThan(0.01);
  });

  it('detects divergence on CONVEX_1D when learning rate is too large', () => {
    let currentX = 2.5;
    const excessiveLr = 1.2; // 1 - 2*1.2 = -1.4 -> magnitude expands exponentially
    let diverged = false;
    for (let i = 0; i < 20; i++) {
      const res = step1D(currentX, excessiveLr, CONVEX_1D);
      if (res.diverged) {
        diverged = true;
        break;
      }
      currentX = res.x;
    }
    expect(diverged).toBe(true);
  });

  it('detects oscillation patterns in gradient history', () => {
    const oscillatingHistory = [
      { grad: 5.0 },
      { grad: -4.5 },
      { grad: 4.2 },
    ];
    expect(detectOscillation1D(oscillatingHistory)).toBe(true);

    const smoothHistory = [
      { grad: 5.0 },
      { grad: 3.0 },
      { grad: 1.8 },
    ];
    expect(detectOscillation1D(smoothHistory)).toBe(false);
  });
});

describe('2D Optimization Functions', () => {
  it('computes exact 2D gradient matching centered finite difference for ELONGATED_BOWL_2D', () => {
    const testPoints: [number, number][] = [
      [-2.0, 1.0],
      [0.0, 0.5],
      [1.5, -1.2],
      [-0.8, -0.3],
    ];
    for (const [x, y] of testPoints) {
      const [agx, agy] = ELONGATED_BOWL_2D.grad(x, y);
      const [ngx, ngy] = centeredDifference2D(ELONGATED_BOWL_2D.f, x, y);
      expect(agx).toBeCloseTo(ngx, 4);
      expect(agy).toBeCloseTo(ngy, 4);
    }
  });

  it('computes exact 2D gradient matching centered finite difference for NON_CONVEX_2D', () => {
    const testPoints: [number, number][] = [
      [-1.5, 0.8],
      [0.0, 0.0],
      [1.2, -0.6],
    ];
    for (const [x, y] of testPoints) {
      const [agx, agy] = NON_CONVEX_2D.grad(x, y);
      const [ngx, ngy] = centeredDifference2D(NON_CONVEX_2D.f, x, y);
      expect(agx).toBeCloseTo(ngx, 4);
      expect(agy).toBeCloseTo(ngy, 4);
    }
  });

  it('performs gradient descent steps in 2D with and without momentum', () => {
    const start: [number, number] = [-2.0, 1.0];
    const plainRes = step2D(start, 0.05, ELONGATED_BOWL_2D, { useMomentum: false });
    expect(plainRes.diverged).toBe(false);
    expect(plainRes.loss).toBeLessThan(ELONGATED_BOWL_2D.f(start[0], start[1]));

    const momentumRes = step2D(start, 0.05, ELONGATED_BOWL_2D, {
      useMomentum: true,
      momentumBeta: 0.9,
      velocity: [0, 0],
    });
    expect(momentumRes.diverged).toBe(false);
    expect(momentumRes.velocity[0]).not.toBe(0);
  });
});
