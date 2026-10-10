import type { Sequential } from './sequential';
import { bceLoss } from './loss';

export interface GradCheckResult {
  passed: boolean;
  maxRelativeError: number;
  paramCount: number;
  details: Array<{
    layerIndex: number;
    paramType: 'weight' | 'bias';
    coord: [number, number] | [number];
    analytical: number;
    numerical: number;
    relativeError: number;
  }>;
}

/**
 * Validates analytical backprop gradients against centered finite differences:
 * (L(theta + eps) - L(theta - eps)) / (2 * eps)
 */
export function gradientCheck(
  network: Sequential,
  X: number[][],
  y: number[][],
  eps = 1e-5,
  tolerance = 1e-6
): GradCheckResult {
  // 1. Compute analytical gradients via forward + backward
  network.forward(X);
  network.backward(y);

  let maxRelativeError = 0;
  let paramCount = 0;
  const details: GradCheckResult['details'] = [];

  // 2. Iterate through each layer and each parameter
  for (let l = 0; l < network.layers.length; l++) {
    const layer = network.layers[l]!;

    // Check weights
    for (let i = 0; i < layer.inputDim; i++) {
      for (let j = 0; j < layer.outputDim; j++) {
        paramCount++;
        const originalVal = layer.weights[i]![j]!;
        const analyticalGrad = layer.gradWeights[i]![j]!;

        // Theta + eps
        layer.weights[i]![j] = originalVal + eps;
        const lossPlus = bceLoss(network.forward(X), y);

        // Theta - eps
        layer.weights[i]![j] = originalVal - eps;
        const lossMinus = bceLoss(network.forward(X), y);

        // Restore
        layer.weights[i]![j] = originalVal;

        const numericalGrad = (lossPlus - lossMinus) / (2 * eps);
        const denominator = Math.max(
          Math.abs(analyticalGrad),
          Math.abs(numericalGrad),
          1e-8
        );
        const relativeError =
          Math.abs(analyticalGrad - numericalGrad) / denominator;

        if (relativeError > maxRelativeError) {
          maxRelativeError = relativeError;
        }

        details.push({
          layerIndex: l,
          paramType: 'weight',
          coord: [i, j],
          analytical: analyticalGrad,
          numerical: numericalGrad,
          relativeError,
        });
      }
    }

    // Check biases
    for (let j = 0; j < layer.outputDim; j++) {
      paramCount++;
      const originalVal = layer.biases[j]!;
      const analyticalGrad = layer.gradBiases[j]!;

      // Theta + eps
      layer.biases[j] = originalVal + eps;
      const lossPlus = bceLoss(network.forward(X), y);

      // Theta - eps
      layer.biases[j] = originalVal - eps;
      const lossMinus = bceLoss(network.forward(X), y);

      // Restore
      layer.biases[j] = originalVal;

      const numericalGrad = (lossPlus - lossMinus) / (2 * eps);
      const denominator = Math.max(
        Math.abs(analyticalGrad),
        Math.abs(numericalGrad),
        1e-8
      );
      const relativeError =
        Math.abs(analyticalGrad - numericalGrad) / denominator;

      if (relativeError > maxRelativeError) {
        maxRelativeError = relativeError;
      }

      details.push({
        layerIndex: l,
        paramType: 'bias',
        coord: [j],
        analytical: analyticalGrad,
        numerical: numericalGrad,
        relativeError,
      });
    }
  }

  // Restore network state by running a clean forward pass
  network.forward(X);

  return {
    passed: maxRelativeError <= tolerance,
    maxRelativeError,
    paramCount,
    details,
  };
}
