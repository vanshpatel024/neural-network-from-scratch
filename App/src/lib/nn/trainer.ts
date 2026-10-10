import type { Sequential } from './sequential';
import type { EpochMetrics } from './types';
import type { PRNG } from './prng';
import { bceLoss, binaryAccuracy } from './loss';

export interface TrainConfig {
  learningRate: number;
  batchSize: number;
  prng: PRNG;
}

/**
 * Executes a single training epoch with mini-batch SGD and data shuffling.
 */
export function trainEpoch(
  network: Sequential,
  X: number[][],
  y: number[][],
  epoch: number,
  config: TrainConfig
): EpochMetrics {
  const N = X.length;
  if (N === 0) {
    return { epoch, loss: 0, accuracy: 0 };
  }

  const { learningRate, batchSize, prng } = config;

  // 1. Create indices and shuffle
  const indices = Array.from({ length: N }, (_, i) => i);
  prng.shuffle(indices);

  // 2. Iterate mini-batches
  const effectiveBatchSize = Math.max(1, Math.min(batchSize, N));
  for (let start = 0; start < N; start += effectiveBatchSize) {
    const end = Math.min(start + effectiveBatchSize, N);
    const batchIndices = indices.slice(start, end);

    const batchX: number[][] = new Array(batchIndices.length);
    const batchY: number[][] = new Array(batchIndices.length);

    for (let b = 0; b < batchIndices.length; b++) {
      const idx = batchIndices[b]!;
      batchX[b] = X[idx]!;
      batchY[b] = y[idx]!;
    }

    // Forward pass
    network.forward(batchX);

    // Backward pass (calculates gradients)
    network.backward(batchY);

    // SGD parameter update
    network.update(learningRate);
  }

  // 3. Compute epoch metrics on full dataset
  const fullPred = network.forward(X);
  const loss = bceLoss(fullPred, y);
  const accuracy = binaryAccuracy(fullPred, y);

  return {
    epoch,
    loss,
    accuracy,
  };
}
