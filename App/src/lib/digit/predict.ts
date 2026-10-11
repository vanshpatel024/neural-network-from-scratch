import type { LayerWeight, PredictionResult } from './types';
import { forward } from './forward';

/**
 * Computes prediction from extracted features and measures inference latency.
 */
export function predict(
  layers: LayerWeight[],
  features: Float32Array,
  hasInk: boolean
): PredictionResult {
  const t0 = performance.now();
  const rawOutput = forward(layers, features);
  const t1 = performance.now();

  const prob1 = Math.max(0, Math.min(1, rawOutput));
  const prob0 = 1.0 - prob1;

  const predictedClass: 0 | 1 = prob1 >= 0.5 ? 1 : 0;
  const confidence = (predictedClass === 1 ? prob1 : prob0) * 100;
  const latencyMs = Math.round((t1 - t0) * 100) / 100;

  return {
    features,
    hasInk,
    prob0,
    prob1,
    predictedClass,
    confidence,
    latencyMs,
    rawOutput,
  };
}
