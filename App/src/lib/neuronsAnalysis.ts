import type { Sequential } from './nn/sequential';

export interface NeuronGridData {
  neuronIndex: number;
  label: string;
  values: number[];
  min: number;
  max: number;
}

export interface LayerNeuronsData {
  layerIndex: number;
  layerName: string;
  neuronCount: number;
  neurons: NeuronGridData[];
  allIdentical: boolean;
}

export interface NetworkNeuronsSnapshot {
  resolution: number;
  layers: LayerNeuronsData[];
  outputNeuron: NeuronGridData;
}

export interface GridBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const DEFAULT_BOUNDS: GridBounds = {
  minX: -2,
  maxX: 2,
  minY: -2,
  maxY: 2,
};

/**
 * Builds a 2D coordinate grid of points spanning the input bounds.
 */
export function buildMeshgridPoints(
  resolution = 24,
  bounds: GridBounds = DEFAULT_BOUNDS
): number[][] {
  const { minX, maxX, minY, maxY } = bounds;
  const stepX = (maxX - minX) / (resolution - 1);
  const stepY = (maxY - minY) / (resolution - 1);

  const points: number[][] = [];
  for (let row = 0; row < resolution; row++) {
    const y = maxY - row * stepY; // top to bottom
    for (let col = 0; col < resolution; col++) {
      const x = minX + col * stepX; // left to right
      points.push([x, y]);
    }
  }
  return points;
}

/**
 * Checks whether all neurons in a layer produce nearly identical outputs across the entire grid.
 * Useful for diagnosing zero initialization and symmetry problems.
 */
export function areNeuronOutputsIdentical(
  neurons: Array<{ values: number[] }>,
  tolerance = 1e-4
): boolean {
  if (neurons.length <= 1) return false;

  const baseline = neurons[0]?.values;
  if (!baseline || baseline.length === 0) return false;

  const cellCount = baseline.length;
  for (let i = 1; i < neurons.length; i++) {
    const candidate = neurons[i]?.values;
    if (!candidate || candidate.length !== cellCount) return false;

    for (let c = 0; c < cellCount; c++) {
      const diff = Math.abs((candidate[c] ?? 0) - (baseline[c] ?? 0));
      if (diff > tolerance) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluates the neuron outputs of a single layer across a 2D input grid.
 */
export function evaluateLayerNeuronGrid(
  network: Sequential,
  layerIndex: number,
  resolution = 24,
  bounds: GridBounds = DEFAULT_BOUNDS
): {
  resolution: number;
  neurons: NeuronGridData[];
} {
  const points = buildMeshgridPoints(resolution, bounds);
  network.forward(points);

  const layer = network.layers[layerIndex];
  if (!layer) {
    return { resolution, neurons: [] };
  }

  const activations = layer.lastA; // points.length x outputDim
  const count = layer.outputDim;
  const numPoints = points.length;

  const neurons: NeuronGridData[] = [];
  for (let n = 0; n < count; n++) {
    const values: number[] = new Array(numPoints);
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (let p = 0; p < numPoints; p++) {
      const val = activations[p]?.[n] ?? 0;
      values[p] = val;
      if (val < min) min = val;
      if (val > max) max = val;
    }

    neurons.push({
      neuronIndex: n,
      label: `N${n + 1}`,
      values,
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 1,
    });
  }

  return { resolution, neurons };
}

/**
 * Evaluates all hidden layers and the final output neuron in a single pass over the grid.
 */
export function evaluateNetworkNeurons(
  network: Sequential,
  resolution = 24,
  bounds: GridBounds = DEFAULT_BOUNDS
): NetworkNeuronsSnapshot {
  const points = buildMeshgridPoints(resolution, bounds);
  network.forward(points);

  const totalLayers = network.layers.length;
  const hiddenCount = Math.max(0, totalLayers - 1);
  const layers: LayerNeuronsData[] = [];

  // Evaluate hidden layers
  for (let l = 0; l < hiddenCount; l++) {
    const layer = network.layers[l]!;
    const activations = layer.lastA;
    const count = layer.outputDim;
    const numPoints = points.length;

    const neurons: NeuronGridData[] = [];
    for (let n = 0; n < count; n++) {
      const values: number[] = new Array(numPoints);
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;

      for (let p = 0; p < numPoints; p++) {
        const val = activations[p]?.[n] ?? 0;
        values[p] = val;
        if (val < min) min = val;
        if (val > max) max = val;
      }

      neurons.push({
        neuronIndex: n,
        label: `N${n + 1}`,
        values,
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : 1,
      });
    }

    const allIdentical = areNeuronOutputsIdentical(neurons);
    layers.push({
      layerIndex: l,
      layerName: `Layer ${l + 1} (${count} ${count === 1 ? 'neuron' : 'neurons'})`,
      neuronCount: count,
      neurons,
      allIdentical,
    });
  }

  // Output neuron (probability)
  const outputLayer = network.layers[totalLayers - 1];
  const outputValues: number[] = new Array(points.length);
  let outMin = Number.POSITIVE_INFINITY;
  let outMax = Number.NEGATIVE_INFINITY;

  if (outputLayer) {
    const activations = outputLayer.lastA;
    for (let p = 0; p < points.length; p++) {
      const val = activations[p]?.[0] ?? 0;
      outputValues[p] = val;
      if (val < outMin) outMin = val;
      if (val > outMax) outMax = val;
    }
  }

  const outputNeuron: NeuronGridData = {
    neuronIndex: 0,
    label: 'Out',
    values: outputValues,
    min: Number.isFinite(outMin) ? outMin : 0,
    max: Number.isFinite(outMax) ? outMax : 1,
  };

  return {
    resolution,
    layers,
    outputNeuron,
  };
}
