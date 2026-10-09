import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  sigmoidDerivative,
  relu,
  reluDerivative,
  clip,
  binaryCrossEntropy,
  transpose,
  matmul,
} from './math';

describe('math primitives', () => {
  it('computes sigmoid and its derivative correctly', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5);
    expect(sigmoidDerivative(0)).toBeCloseTo(0.25);
    expect(sigmoid(100)).toBe(1);
    expect(sigmoid(-100)).toBe(0);
  });

  it('computes relu and its derivative correctly', () => {
    expect(relu(5)).toBe(5);
    expect(relu(-5)).toBe(0);
    expect(reluDerivative(5)).toBe(1);
    expect(reluDerivative(-5)).toBe(0);
  });

  it('clips values properly within numerical stability bounds', () => {
    expect(clip(0)).toBeCloseTo(1e-15);
    expect(clip(1)).toBeCloseTo(1 - 1e-15);
    expect(clip(0.5)).toBe(0.5);
  });

  it('evaluates binary cross-entropy loss correctly', () => {
    const lossNear1 = binaryCrossEntropy(1, 0.99);
    expect(lossNear1).toBeGreaterThan(0);
    expect(lossNear1).toBeLessThan(0.02);

    const lossNear0 = binaryCrossEntropy(0, 0.01);
    expect(lossNear0).toBeGreaterThan(0);
    expect(lossNear0).toBeLessThan(0.02);
  });

  it('transposes a matrix correctly', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const transposed = transpose(matrix);
    expect(transposed).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  it('multiplies matrices correctly', () => {
    const a = [
      [1, 2],
      [3, 4],
    ];
    const b = [
      [2, 0],
      [1, 2],
    ];
    // a * b = [[1*2 + 2*1, 1*0 + 2*2], [3*2 + 4*1, 3*0 + 4*2]] = [[4, 4], [10, 8]]
    expect(matmul(a, b)).toEqual([
      [4, 4],
      [10, 8],
    ]);
  });
});
