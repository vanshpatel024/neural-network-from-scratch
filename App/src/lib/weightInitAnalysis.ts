import { PRNG } from './nn/prng';
import { activate } from './nn/activations';
import type { ActivationType } from './nn/types';

export type WeightInitMode = 'zeros' | 'small' | 'large' | 'xavier' | 'he';

export interface LayerDistribution {
  layerIndex: number;
  mean: number;
  std: number;
  histogram: Array<{ bin: string; count: number }>;
  isVanished: boolean;
  isSaturatedOrExploded: boolean;
}

export interface WeightInitSimulationResult {
  layers: LayerDistribution[];
  overallStatus: 'vanished' | 'exploded' | 'symmetric' | 'healthy';
  statusMessage: string;
}

/**
 * Simulates signal propagation through a deep network under different weight initializations.
 */
export function simulateLayerDistributions(
  depth = 6,
  mode: WeightInitMode = 'xavier',
  activation: ActivationType = 'tanh',
  batchSize = 300,
  layerDim = 64,
  seed = 42
): WeightInitSimulationResult {
  const prng = new PRNG(seed);

  // Initialize input data ~ N(0, 1)
  let currentActivations: number[][] = [];
  for (let b = 0; b < batchSize; b++) {
    const row: number[] = [];
    for (let d = 0; d < layerDim; d++) {
      row.push(prng.gaussian(0, 1));
    }
    currentActivations.push(row);
  }

  const layers: LayerDistribution[] = [];

  for (let l = 0; l < depth; l++) {
    // Determine weight standard deviation based on mode
    let weightStd = 0;
    switch (mode) {
      case 'zeros':
        weightStd = 0;
        break;
      case 'small':
        weightStd = 0.015; // Naive small: signals vanish
        break;
      case 'large':
        weightStd = 1.0; // Naive large: signals saturate/explode
        break;
      case 'xavier':
        weightStd = Math.sqrt(2 / (layerDim + layerDim));
        break;
      case 'he':
        weightStd = Math.sqrt(2 / layerDim);
        break;
    }

    // Generate weights layerDim x layerDim
    const weights: number[][] = [];
    for (let i = 0; i < layerDim; i++) {
      const row: number[] = [];
      for (let j = 0; j < layerDim; j++) {
        row.push(mode === 'zeros' ? 0 : prng.gaussian(0, weightStd));
      }
      weights.push(row);
    }

    // Forward pass: Z = A * W, A_next = f(Z)
    const nextActivations: number[][] = [];
    const flatValues: number[] = [];

    for (let b = 0; b < batchSize; b++) {
      const rowA = currentActivations[b]!;
      const rowNext: number[] = [];
      for (let j = 0; j < layerDim; j++) {
        let sum = 0;
        for (let i = 0; i < layerDim; i++) {
          sum += rowA[i]! * weights[i]![j]!;
        }
        const val = activate(sum, activation);
        rowNext.push(val);
        flatValues.push(val);
      }
      nextActivations.push(rowNext);
    }

    currentActivations = nextActivations;

    // Calculate mean and standard deviation
    let sum = 0;
    for (const v of flatValues) sum += v;
    const mean = sum / flatValues.length;

    let varSum = 0;
    for (const v of flatValues) varSum += (v - mean) ** 2;
    const std = Math.sqrt(varSum / flatValues.length);

    // Compute histogram across 11 bins
    const minRange = activation === 'tanh' ? -1.0 : -0.2;
    const maxRange = activation === 'tanh' ? 1.0 : 2.5;
    const numBins = 11;
    const step = (maxRange - minRange) / numBins;
    const counts = new Array(numBins).fill(0);

    for (const v of flatValues) {
      const binIdx = Math.min(
        numBins - 1,
        Math.max(0, Math.floor((v - minRange) / step))
      );
      counts[binIdx]++;
    }

    const histogram = counts.map((count, idx) => {
      const center = minRange + (idx + 0.5) * step;
      return {
        bin: center.toFixed(1),
        count,
      };
    });

    const isVanished = std < 0.05 && mode !== 'zeros';
    const isSaturatedOrExploded =
      activation === 'tanh'
        ? flatValues.filter((v) => Math.abs(v) > 0.95).length / flatValues.length > 0.7
        : std > 3.0;

    layers.push({
      layerIndex: l + 1,
      mean: Math.round(mean * 1000) / 1000,
      std: Math.round(std * 1000) / 1000,
      histogram,
      isVanished,
      isSaturatedOrExploded,
    });
  }

  // Determine overall status
  const lastLayer = layers[layers.length - 1]!;
  let overallStatus: WeightInitSimulationResult['overallStatus'] = 'healthy';
  let statusMessage = 'Activations remain stable and well-scaled across all layers.';

  if (mode === 'zeros') {
    overallStatus = 'symmetric';
    statusMessage = 'All activations collapsed to zero. Neurons cannot break symmetry.';
  } else if (lastLayer.isVanished || lastLayer.std < 0.05) {
    overallStatus = 'vanished';
    statusMessage = 'Signal vanished to zero in deep layers. Gradients will freeze.';
  } else if (lastLayer.isSaturatedOrExploded) {
    overallStatus = 'exploded';
    statusMessage = 'Activations saturated at limits. Derivatives vanish.';
  }

  return {
    layers,
    overallStatus,
    statusMessage,
  };
}
