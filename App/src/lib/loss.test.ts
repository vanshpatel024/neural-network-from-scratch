import { describe, it, expect } from 'vitest';
import {
  bce,
  bceBatch,
  dBce,
  mse,
  mseBatch,
  dMse,
  computePointsLoss,
  DEFAULT_POINTS_1D,
} from './loss';

describe('Loss Functions (BCE and MSE)', () => {
  it('computes binary cross entropy matching hand calculations', () => {
    // When y = 1 and p = 0.5: -ln(0.5) ≈ 0.693147
    expect(bce(0.5, 1)).toBeCloseTo(0.693147, 5);

    // When y = 1 and p = 0.9: -ln(0.9) ≈ 0.105360
    expect(bce(0.9, 1)).toBeCloseTo(0.10536, 5);

    // When y = 0 and p = 0.1: -ln(1 - 0.1) = -ln(0.9) ≈ 0.105360
    expect(bce(0.1, 0)).toBeCloseTo(0.10536, 5);

    // When y = 1 and p = 0.01: confident wrong prediction has large penalty: -ln(0.01) ≈ 4.60517
    expect(bce(0.01, 1)).toBeCloseTo(4.60517, 4);
  });

  it('clips probability to prevent log(0) NaN or infinity', () => {
    // p = 0 when y = 1: without clipping would be -ln(0) = Infinity
    const lossZero = bce(0, 1);
    expect(Number.isFinite(lossZero)).toBe(true);
    expect(lossZero).toBeGreaterThan(30);

    // p = 1 when y = 0: without clipping would be -ln(0) = Infinity
    const lossOne = bce(1, 0);
    expect(Number.isFinite(lossOne)).toBe(true);
    expect(lossOne).toBeGreaterThan(30);
  });

  it('computes BCE analytical derivative correctly', () => {
    // dBCE/dp = (p - y) / (p * (1 - p))
    // y = 1, p = 0.8 => (0.8 - 1) / (0.8 * 0.2) = -0.2 / 0.16 = -1.25
    expect(dBce(0.8, 1)).toBeCloseTo(-1.25, 5);

    // y = 0, p = 0.8 => (0.8 - 0) / (0.8 * 0.2) = 0.8 / 0.16 = 5.0
    expect(dBce(0.8, 0)).toBeCloseTo(5.0, 5);
  });

  it('computes MSE and derivative matching ground truth', () => {
    // MSE: (p - y)^2
    // y = 1, p = 0.8 => (0.8 - 1)^2 = (-0.2)^2 = 0.04
    expect(mse(0.8, 1)).toBeCloseTo(0.04, 5);

    // dMSE: 2*(p - y)
    // y = 1, p = 0.8 => 2 * (-0.2) = -0.4
    expect(dMse(0.8, 1)).toBeCloseTo(-0.4, 5);
  });

  it('computes batch losses accurately', () => {
    const p = [0.8, 0.2];
    const y = [1, 0];
    // Each sample error is bce(0.8, 1) = -ln(0.8) ≈ 0.223144 and bce(0.2, 0) = -ln(0.8) ≈ 0.223144
    expect(bceBatch(p, y)).toBeCloseTo(0.223144, 5);

    // MSE batch: (0.04 + 0.04) / 2 = 0.04
    expect(mseBatch(p, y)).toBeCloseTo(0.04, 5);
  });

  it('computes 1D points loss with sigmoid curve', () => {
    // When w is high (e.g. 3) and b = 0, points are well-separated, loss should be small
    const separated = computePointsLoss(DEFAULT_POINTS_1D, 3.0, 0.0);
    expect(separated.totalLoss).toBeLessThan(0.3);

    // When w = 0 and b = 0, predictions are all 0.5, loss should be ln(2) ≈ 0.6931
    const flat = computePointsLoss(DEFAULT_POINTS_1D, 0.0, 0.0);
    expect(flat.totalLoss).toBeCloseTo(0.6931, 2);
  });
});
