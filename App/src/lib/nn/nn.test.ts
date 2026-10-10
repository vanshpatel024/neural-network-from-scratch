import { describe, it, expect } from 'vitest';
import {
  Sequential,
  gradientCheck,
  generateDataset,
  trainEpoch,
  PRNG,
  bceLoss,
} from './index';

describe('Neural Network Engine (src/lib/nn)', () => {
  it('passes gradient checking with relative error < 1e-6 on a small network', () => {
    // 2 inputs -> 3 hidden (tanh) -> 1 output (sigmoid)
    const net = new Sequential({
      inputDim: 2,
      hiddenLayers: [3],
      outputDim: 1,
      activation: 'tanh',
      initType: 'xavier',
      seed: 123,
    });

    const X = [
      [0.5, -0.3],
      [-0.2, 0.8],
      [0.1, 0.2],
      [-0.4, -0.6],
    ];
    const y = [[1], [0], [1], [0]];

    const check = gradientCheck(net, X, y, 1e-5, 1e-6);

    expect(check.passed).toBe(true);
    expect(check.maxRelativeError).toBeLessThan(1e-6);
    expect(check.paramCount).toBe(2 * 3 + 3 + 3 * 1 + 1); // 13 parameters
  });

  it('can solve XOR with high accuracy (>= 95%) using a tiny network', () => {
    // Standard XOR problem: [0,0]->0, [0,1]->1, [1,0]->1, [1,1]->0
    // Scaled around [-1, 1]
    const X = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    const y = [[0], [1], [1], [0]];

    // 2 -> 6 hidden (tanh) -> 1 output (sigmoid)
    const net = new Sequential({
      inputDim: 2,
      hiddenLayers: [6],
      outputDim: 1,
      activation: 'tanh',
      initType: 'xavier',
      seed: 42,
    });

    const prng = new PRNG(100);

    // Train for 300 epochs with lr = 0.5
    for (let ep = 0; ep < 300; ep++) {
      trainEpoch(net, X, y, ep, {
        learningRate: 0.5,
        batchSize: 4,
        prng,
      });
    }

    const predictions = net.forward(X);
    const loss = bceLoss(predictions, y);

    // Predictions should be very close to targets
    expect(predictions[0]![0]).toBeLessThan(0.15); // [-1, -1] -> 0
    expect(predictions[1]![0]).toBeGreaterThan(0.85); // [-1, 1] -> 1
    expect(predictions[2]![0]).toBeGreaterThan(0.85); // [1, -1] -> 1
    expect(predictions[3]![0]).toBeLessThan(0.15); // [1, 1] -> 0
    expect(loss).toBeLessThan(0.2);
  });

  it('substantially decreases loss when training on two moons dataset', () => {
    const data = generateDataset('moons', 100, 0.05, 777);

    // 2 -> 8 hidden (relu) -> 4 hidden (relu) -> 1 output
    const net = new Sequential({
      inputDim: 2,
      hiddenLayers: [8, 4],
      outputDim: 1,
      activation: 'relu',
      initType: 'he',
      seed: 777,
    });

    const prng = new PRNG(999);

    const initialPred = net.forward(data.X);
    const initialLoss = bceLoss(initialPred, data.y);

    let finalLoss = initialLoss;
    for (let ep = 0; ep < 80; ep++) {
      const metrics = trainEpoch(net, data.X, data.y, ep, {
        learningRate: 0.2,
        batchSize: 16,
        prng,
      });
      finalLoss = metrics.loss;
    }

    // Loss must drop by at least 40%
    expect(finalLoss).toBeLessThan(initialLoss * 0.6);
  });

  it('demonstrates symmetry failure with zero initialization', () => {
    const net = new Sequential({
      inputDim: 2,
      hiddenLayers: [4],
      outputDim: 1,
      activation: 'relu',
      initType: 'zeros',
      seed: 42,
    });

    // Hidden layer weights should all be 0
    const hiddenLayer = net.layers[0]!;
    for (let i = 0; i < hiddenLayer.inputDim; i++) {
      for (let j = 0; j < hiddenLayer.outputDim; j++) {
        expect(hiddenLayer.weights[i]![j]).toBe(0);
      }
    }
  });

  it('generates reproducible dataset with seeded PRNG', () => {
    const data1 = generateDataset('circles', 50, 0.1, 42);
    const data2 = generateDataset('circles', 50, 0.1, 42);

    expect(data1.points.length).toBe(50);
    expect(data1.points[0]!.x).toBe(data2.points[0]!.x);
    expect(data1.points[0]!.y).toBe(data2.points[0]!.y);
  });
});
