import { describe, it, expect } from 'vitest';
import {
  matmul,
  addBias,
  applyElementwise,
  transpose,
  computeForwardPass231,
  computeBackwardPass231,
} from './matrix';

describe('Matrix Operations & Forward Propagation', () => {
  it('multiplies matrices correctly matching hand-computed values', () => {
    // A (2x3), B (3x2)
    const A = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const B = [
      [7, 8],
      [9, 1],
      [2, 3],
    ];
    // Row 0: [1*7 + 2*9 + 3*2, 1*8 + 2*1 + 3*3] = [7+18+6, 8+2+9] = [31, 19]
    // Row 1: [4*7 + 5*9 + 6*2, 4*8 + 5*1 + 6*3] = [28+45+12, 32+5+18] = [85, 55]
    const C = matmul(A, B);
    expect(C).toEqual([
      [31, 19],
      [85, 55],
    ]);
  });

  it('throws descriptive error on inner dimension mismatch', () => {
    const A = [[1, 2]]; // 1x2
    const B = [[1, 2]]; // 1x2 (mismatch! colsA=2, rowsB=1)
    expect(() => matmul(A, B)).toThrowError(/Matrix dimensions mismatch/);
  });

  it('broadcasts bias addition across matrix rows', () => {
    const Z = [
      [10, 20],
      [30, 40],
    ];
    const b = [1, 2];
    const res = addBias(Z, b);
    expect(res).toEqual([
      [11, 22],
      [31, 42],
    ]);
  });

  it('computes exact forward pass through 2-3-1 network matching hand calculations', () => {
    // Inputs: x1 = 1.0, x2 = 2.0
    // W1 = [[0.8, -0.5, 0.4], [-0.3, 0.9, -0.6]]
    // b1 = [0.1, -0.2, 0.3]
    // Z1 = [1*0.8 + 2*(-0.3) + 0.1, 1*(-0.5) + 2*0.9 - 0.2, 1*0.4 + 2*(-0.6) + 0.3]
    //    = [0.8 - 0.6 + 0.1, -0.5 + 1.8 - 0.2, 0.4 - 1.2 + 0.3]
    //    = [0.3, 1.1, -0.5]
    // A1 = ReLU(Z1) = [0.3, 1.1, 0.0]
    // W2 = [[1.2], [-0.8], [0.5]], b2 = [-0.1]
    // Z2 = [0.3*1.2 + 1.1*(-0.8) + 0.0*0.5 - 0.1] = [0.36 - 0.88 + 0 - 0.1] = [-0.62]
    // A2 = sigmoid(-0.62) = 1 / (1 + exp(0.62)) ≈ 0.350025
    const forward = computeForwardPass231(1.0, 2.0);

    expect(forward.Z1[0]?.[0]).toBeCloseTo(0.3, 5);
    expect(forward.Z1[0]?.[1]).toBeCloseTo(1.1, 5);
    expect(forward.Z1[0]?.[2]).toBeCloseTo(-0.5, 5);

    expect(forward.A1[0]?.[0]).toBeCloseTo(0.3, 5);
    expect(forward.A1[0]?.[1]).toBeCloseTo(1.1, 5);
    expect(forward.A1[0]?.[2]).toBe(0);

    expect(forward.Z2[0]?.[0]).toBeCloseTo(-0.62, 5);
    expect(forward.A2[0]?.[0]).toBeCloseTo(0.349781, 5);
  });

  it('applies elementwise unary functions across a matrix', () => {
    const M = [
      [-2, 0, 3],
      [4, -1, 5],
    ];
    const reluM = applyElementwise(M, (v) => Math.max(0, v));
    expect(reluM).toEqual([
      [0, 0, 3],
      [4, 0, 5],
    ]);
  });

  it('transposes matrix correctly', () => {
    const M = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    expect(transpose(M)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  it('computes exact backward pass gradients through 2-3-1 network', () => {
    // x1 = 1.0, x2 = 2.0, target y = 1.0
    const bwd = computeBackwardPass231(1.0, 2.0, 1.0);

    // Forward checks: A2 ≈ 0.349781
    expect(bwd.A2[0]?.[0]).toBeCloseTo(0.349781, 5);

    // dZ2 = yHat - y ≈ 0.349781 - 1 = -0.650219
    expect(bwd.dZ2[0]?.[0]).toBeCloseTo(-0.650219, 5);

    // dW2 = A1^T * dZ2 = [0.3 * -0.650219, 1.1 * -0.650219, 0 * ...]
    expect(bwd.dW2[0]?.[0]).toBeCloseTo(-0.195066, 5);
    expect(bwd.dW2[1]?.[0]).toBeCloseTo(-0.715241, 5);
    expect(bwd.dW2[2]?.[0]).toBe(0);

    // db2 = dZ2
    expect(bwd.db2[0]?.[0]).toBeCloseTo(-0.650219, 5);

    // dA1 = dZ2 * W2^T = -0.650219 * [1.2, -0.8, 0.5]
    expect(bwd.dA1[0]?.[0]).toBeCloseTo(-0.780263, 5);
    expect(bwd.dA1[0]?.[1]).toBeCloseTo(0.520175, 5);
    expect(bwd.dA1[0]?.[2]).toBeCloseTo(-0.325110, 5);

    // dZ1 = dA1 * (Z1 > 0): node 3 had Z1 = -0.5 <= 0, so gradient is gated to 0!
    expect(bwd.dZ1[0]?.[0]).toBeCloseTo(-0.780263, 5);
    expect(bwd.dZ1[0]?.[1]).toBeCloseTo(0.520175, 5);
    expect(bwd.dZ1[0]?.[2]).toBe(0);

    // dW1 = X^T * dZ1: row 0 is 1.0 * dZ1, row 1 is 2.0 * dZ1
    expect(bwd.dW1[0]?.[0]).toBeCloseTo(-0.780263, 5);
    expect(bwd.dW1[0]?.[1]).toBeCloseTo(0.520175, 5);
    expect(bwd.dW1[0]?.[2]).toBe(0);

    expect(bwd.dW1[1]?.[0]).toBeCloseTo(-1.560526, 5);
    expect(bwd.dW1[1]?.[1]).toBeCloseTo(1.040350, 5);
    expect(bwd.dW1[1]?.[2]).toBe(0);
  });
});
