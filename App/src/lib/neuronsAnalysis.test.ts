import { describe, it, expect } from 'vitest';
import { Sequential } from './nn/sequential';
import { PRNG } from './nn/prng';
import {
  evaluateLayerNeuronGrid,
  evaluateNetworkNeurons,
  areNeuronOutputsIdentical,
} from './neuronsAnalysis';
import { generateDataset, trainEpoch } from './nn';

describe('neuronsAnalysis', () => {
  it('returns the correct shape (neurons x grid cells) and matches forward pass for a tiny network with known weights', () => {
    // 2 inputs -> 3 hidden neurons (linear) -> 1 output (sigmoid)
    const net = new Sequential({
      inputDim: 2,
      hiddenLayers: [3],
      outputDim: 1,
      activation: 'linear',
      initType: 'zeros',
      seed: 42,
    });

    // Manually set known weights and biases
    // Neuron 0: z = 1.0*x + 2.0*y + 0.5
    // Neuron 1: z = -1.0*x + 0.5*y + 1.0
    // Neuron 2: z = 0.0*x + 3.0*y - 0.2
    net.layers[0]!.weights = [
      [1.0, -1.0, 0.0],
      [2.0, 0.5, 3.0],
    ];
    net.layers[0]!.biases = [0.5, 1.0, -0.2];

    const resolution = 12; // 12 x 12 = 144 cells
    const bounds = { minX: -2, maxX: 2, minY: -2, maxY: 2 };
    const result = evaluateLayerNeuronGrid(net, 0, resolution, bounds);

    expect(result.resolution).toBe(12);
    expect(result.neurons).toHaveLength(3);

    for (const neuron of result.neurons) {
      expect(neuron.values).toHaveLength(144);
    }

    // Verify cell output against manual forward pass at a specific coordinate
    // The top-left corner is at (minX, maxY) = (-2, 2)
    // Neuron 0: 1.0*(-2) + 2.0*(2) + 0.5 = -2 + 4 + 0.5 = 2.5
    // Neuron 1: -1.0*(-2) + 0.5*(2) + 1.0 = 2 + 1 + 1.0 = 4.0
    // Neuron 2: 0.0*(-2) + 3.0*(2) - 0.2 = 6 - 0.2 = 5.8
    expect(result.neurons[0]!.values[0]).toBeCloseTo(2.5, 4);
    expect(result.neurons[1]!.values[0]).toBeCloseTo(4.0, 4);
    expect(result.neurons[2]!.values[0]).toBeCloseTo(5.8, 4);

    // Verify consistency with full evaluateNetworkNeurons
    const snapshot = evaluateNetworkNeurons(net, resolution, bounds);
    expect(snapshot.layers).toHaveLength(1);
    expect(snapshot.layers[0]!.neurons).toHaveLength(3);
    expect(snapshot.layers[0]!.neurons[0]!.values[0]).toBeCloseTo(2.5, 4);
  });

  it('detects that all neurons are identical for zeros initialization and different for trained Xavier network', () => {
    // 1. Zeros initialization
    const zerosNet = new Sequential({
      inputDim: 2,
      hiddenLayers: [4],
      outputDim: 1,
      activation: 'tanh',
      initType: 'zeros',
      seed: 123,
    });

    const zerosSnapshot = evaluateNetworkNeurons(zerosNet, 16);
    expect(zerosSnapshot.layers[0]!.allIdentical).toBe(true);
    expect(areNeuronOutputsIdentical(zerosSnapshot.layers[0]!.neurons)).toBe(true);

    // 2. Xavier initialization with training
    const xavierNet = new Sequential({
      inputDim: 2,
      hiddenLayers: [4],
      outputDim: 1,
      activation: 'tanh',
      initType: 'xavier',
      seed: 456,
    });

    const { X, y } = generateDataset('moons', 80, 0.1, 42);
    // Train for 10 epochs to ensure neurons specialize
    for (let ep = 1; ep <= 10; ep++) {
      trainEpoch(xavierNet, X, y, ep, {
        learningRate: 0.2,
        batchSize: 16,
        prng: new PRNG(ep),
      });
    }

    const xavierSnapshot = evaluateNetworkNeurons(xavierNet, 16);
    expect(xavierSnapshot.layers[0]!.allIdentical).toBe(false);
    expect(areNeuronOutputsIdentical(xavierSnapshot.layers[0]!.neurons)).toBe(false);
  });
});
