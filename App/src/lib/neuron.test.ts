import { describe, it, expect } from 'vitest';
import { computeNeuron2D, calculateDecisionBoundary } from './neuron';

describe('Neuron & Decision Boundary', () => {
  it('computes weighted sum and sigmoid activation correctly', () => {
    // x1 = 1.0, x2 = 2.0, w1 = 0.5, w2 = -0.5, b = 1.0
    // z = 1.0*0.5 + 2.0*(-0.5) + 1.0 = 0.5 - 1.0 + 1.0 = 0.5
    // a = sigmoid(0.5) = 1 / (1 + exp(-0.5)) ≈ 0.622459
    const state = computeNeuron2D(1.0, 2.0, 0.5, -0.5, 1.0);
    expect(state.z).toBeCloseTo(0.5, 5);
    expect(state.a).toBeCloseTo(0.622459, 5);
  });

  it('calculates decision boundary line for w1*x1 + w2*x2 + b = 0', () => {
    // 2*x1 + 1*x2 - 1 = 0 => x2 = -2*x1 + 1
    const boundary = calculateDecisionBoundary(2, 1, -1);
    expect(boundary.isVertical).toBe(false);
    expect(boundary.slope).toBeCloseTo(-2, 4);
    expect(boundary.yIntercept).toBeCloseTo(1, 4);
  });

  it('handles vertical decision boundary when w2 is zero', () => {
    // 2*x1 + 0*x2 - 4 = 0 => x1 = 2
    const boundary = calculateDecisionBoundary(2, 0, -4);
    expect(boundary.isVertical).toBe(true);
    expect(boundary.xIntercept).toBeCloseTo(2, 4);
  });
});
