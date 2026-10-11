import type { LayerWeight } from './types';

/**
 * Executes a full forward pass through the parsed network layers.
 * Uses Float64Array for exact numerical consistency with NumPy.
 *
 * @param layers - Sequence of validated layers with flattened weights and biases.
 * @param features - Input vector of 400 pixel intensities [0..1].
 * @returns Probability of class 1 in range [0, 1].
 */
export function forward(
  layers: LayerWeight[],
  features: ArrayLike<number>
): number {
  if (layers.length === 0) {
    throw new Error('Cannot execute forward pass with zero layers.');
  }

  let A = new Float64Array(features.length);
  for (let i = 0; i < features.length; i++) {
    A[i] = Number(features[i]);
  }

  for (let l = 0; l < layers.length; l++) {
    const layer = layers[l]!;
    const { nIn, nOut, weights, bias, activation } = layer;

    const Z = new Float64Array(nOut);

    // Linear matrix transformation: Z = A * W + b
    for (let j = 0; j < nOut; j++) {
      let sum = bias[j] ?? 0;
      for (let i = 0; i < nIn; i++) {
        sum += (A[i] ?? 0) * (weights[i * nOut + j] ?? 0);
      }
      Z[j] = sum;
    }

    // Apply activation function
    if (activation === 'relu') {
      A = new Float64Array(nOut);
      for (let j = 0; j < nOut; j++) {
        const val = Z[j]!;
        A[j] = val > 0 ? val : 0;
      }
    } else if (activation === 'sigmoid') {
      A = new Float64Array(nOut);
      for (let j = 0; j < nOut; j++) {
        // Numerically stable sigmoid clamping to [-500, 500]
        const z = Math.max(-500, Math.min(500, Z[j]!));
        A[j] = 1.0 / (1.0 + Math.exp(-z));
      }
    } else {
      A = Z;
    }
  }

  // Final scalar output probability for class 1
  const rawProb = A[0] ?? 0;
  return Math.max(0, Math.min(1, rawProb));
}
