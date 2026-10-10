import { describe, it, expect } from 'vitest';
import { simulateLayerDistributions } from './weightInitAnalysis';

describe('weightInitAnalysis', () => {
  it('correctly reports symmetric zero activations under zeros initialization', () => {
    const res = simulateLayerDistributions(6, 'zeros', 'tanh');
    expect(res.overallStatus).toBe('symmetric');
    for (const layer of res.layers) {
      expect(layer.mean).toBe(0);
      expect(layer.std).toBe(0);
    }
  });

  it('detects vanishing signals under too small random initialization', () => {
    const res = simulateLayerDistributions(7, 'small', 'tanh');
    expect(res.overallStatus).toBe('vanished');
    const last = res.layers[res.layers.length - 1]!;
    expect(last.std).toBeLessThan(0.05);
  });

  it('detects saturation under too large random initialization', () => {
    const res = simulateLayerDistributions(6, 'large', 'tanh');
    expect(res.overallStatus).toBe('exploded');
    const last = res.layers[res.layers.length - 1]!;
    expect(last.isSaturatedOrExploded).toBe(true);
  });

  it('preserves healthy activation variance across depth with Xavier initialization on tanh', () => {
    const res = simulateLayerDistributions(6, 'xavier', 'tanh');
    expect(res.overallStatus).toBe('healthy');
    for (const layer of res.layers) {
      expect(layer.std).toBeGreaterThan(0.2);
      expect(layer.std).toBeLessThan(1.2);
    }
  });

  it('preserves healthy activation variance across depth with He initialization on relu', () => {
    const res = simulateLayerDistributions(6, 'he', 'relu');
    expect(res.overallStatus).toBe('healthy');
    for (const layer of res.layers) {
      expect(layer.std).toBeGreaterThan(0.2);
      expect(layer.std).toBeLessThan(2.0);
    }
  });
});
