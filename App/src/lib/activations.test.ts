import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  dSigmoid,
  tanh,
  dTanh,
  relu,
  dRelu,
  leakyRelu,
  dLeakyRelu,
} from './activations';
import { centeredDifference1D } from './optim';

describe('Activation Functions & Derivatives', () => {
  it('computes exact hand-computed values for Sigmoid', () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(2)).toBeCloseTo(0.880797, 5);
    expect(sigmoid(-2)).toBeCloseTo(0.119203, 5);
    // Numerical stability check for extreme values
    expect(sigmoid(100)).toBeCloseTo(1, 5);
    expect(sigmoid(-100)).toBeCloseTo(0, 5);
  });

  it('matches numerical derivative for Sigmoid', () => {
    for (const z of [-3, -1, 0, 1.5, 3]) {
      const analytic = dSigmoid(z);
      const numerical = centeredDifference1D(sigmoid, z);
      expect(analytic).toBeCloseTo(numerical, 4);
    }
  });

  it('computes exact values and matches numerical derivative for Tanh', () => {
    expect(tanh(0)).toBe(0);
    expect(tanh(1)).toBeCloseTo(0.761594, 5);
    expect(tanh(-1)).toBeCloseTo(-0.761594, 5);

    for (const z of [-2, -0.5, 0, 0.5, 2]) {
      const analytic = dTanh(z);
      const numerical = centeredDifference1D(tanh, z);
      expect(analytic).toBeCloseTo(numerical, 4);
    }
  });

  it('computes exact values and derivatives for ReLU', () => {
    expect(relu(-5)).toBe(0);
    expect(relu(0)).toBe(0);
    expect(relu(4.2)).toBe(4.2);

    expect(dRelu(2.5)).toBe(1);
    expect(dRelu(-2.5)).toBe(0);
  });

  it('computes exact values and derivatives for Leaky ReLU', () => {
    expect(leakyRelu(3, 0.01)).toBe(3);
    expect(leakyRelu(-4, 0.01)).toBeCloseTo(-0.04, 5);

    expect(dLeakyRelu(3, 0.01)).toBe(1);
    expect(dLeakyRelu(-4, 0.01)).toBe(0.01);
  });
});
