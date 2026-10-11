import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { findBoundingBox } from './preprocessing';
import { parseWeights } from './parseWeights';
import { forward } from './forward';
import { predict } from './predict';
import type { LayerWeight } from './types';

describe('Digit Engine Preprocessing: findBoundingBox', () => {
  const width = 280;
  const height = 280;

  it('detects empty canvas with no ink', () => {
    const data = new Uint8ClampedArray(width * height * 4); // All zeros
    const bbox = findBoundingBox(data, width, height, 20);
    expect(bbox.hasInk).toBe(false);
  });

  it('detects a single dot at specific coordinate', () => {
    const data = new Uint8ClampedArray(width * height * 4);
    const targetX = 142;
    const targetY = 88;
    const idx = (targetY * width + targetX) * 4;
    data[idx] = 255; // Red channel
    data[idx + 1] = 255;
    data[idx + 2] = 255;
    data[idx + 3] = 255;

    const bbox = findBoundingBox(data, width, height, 20);
    expect(bbox.hasInk).toBe(true);
    expect(bbox.minX).toBe(targetX);
    expect(bbox.maxX).toBe(targetX);
    expect(bbox.minY).toBe(targetY);
    expect(bbox.maxY).toBe(targetY);
  });

  it('detects full canvas bounds', () => {
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(255); // Entire canvas white
    const bbox = findBoundingBox(data, width, height, 20);
    expect(bbox.hasInk).toBe(true);
    expect(bbox.minX).toBe(0);
    expect(bbox.maxX).toBe(width - 1);
    expect(bbox.minY).toBe(0);
    expect(bbox.maxY).toBe(height - 1);
  });
});

describe('Digit Engine: parseWeights', () => {
  // Helper to create a dummy 400 -> 25 -> 1 network
  const makeDummyWeights = () => ({
    W1: Array.from({ length: 400 }, () => new Array(25).fill(0.01)),
    b1: new Array(25).fill(0.1),
    W2: Array.from({ length: 25 }, () => new Array(1).fill(0.05)),
    b2: [0.2],
  });

  it('accepts Schema 1: { W1, b1, W2, b2... }', () => {
    const data = makeDummyWeights();
    const parsed = parseWeights(data);
    expect(parsed.layers.length).toBe(2);
    expect(parsed.layers[0]?.nIn).toBe(400);
    expect(parsed.layers[0]?.nOut).toBe(25);
    expect(parsed.layers[0]?.activation).toBe('relu');
    expect(parsed.layers[1]?.nIn).toBe(25);
    expect(parsed.layers[1]?.nOut).toBe(1);
    expect(parsed.layers[1]?.activation).toBe('sigmoid');
    expect(parsed.architectureSummary).toBe('400 → 25 → 1');
  });

  it('accepts Schema 2: { layers: [{ W, b }, ...] } with 2D bias [[...]]', () => {
    const data = {
      layers: [
        {
          W: Array.from({ length: 400 }, () => new Array(15).fill(0.02)),
          b: [new Array(15).fill(0.0)], // 2D bias [[...]]
        },
        {
          W: Array.from({ length: 15 }, () => new Array(1).fill(0.03)),
          b: [[0.5]],
        },
      ],
    };
    const parsed = parseWeights(data);
    expect(parsed.layers.length).toBe(2);
    expect(parsed.layers[0]?.nIn).toBe(400);
    expect(parsed.layers[0]?.nOut).toBe(15);
    expect(parsed.layers[1]?.nOut).toBe(1);
  });

  it('accepts Schema 3: array of [{ W, b }, ...]', () => {
    const data = [
      {
        W: Array.from({ length: 400 }, () => new Array(10).fill(0.01)),
        b: new Array(10).fill(0.0),
      },
      {
        W: Array.from({ length: 10 }, () => new Array(1).fill(0.02)),
        b: [0.0],
      },
    ];
    const parsed = parseWeights(data);
    expect(parsed.layers.length).toBe(2);
    expect(parsed.layers[0]?.nOut).toBe(10);
  });

  it('rejects missing layers with clear simple error', () => {
    expect(() => parseWeights({})).toThrowError(
      /Could not find layers in weights file/
    );
  });

  it('rejects layer where bias length does not match output size', () => {
    const data = {
      W1: Array.from({ length: 400 }, () => new Array(25).fill(0.01)),
      b1: new Array(24).fill(0.1), // mismatch: 24 vs 25
      W2: Array.from({ length: 25 }, () => new Array(1).fill(0.05)),
      b2: [0.2],
    };
    expect(() => parseWeights(data)).toThrowError(
      /Layer 1 bias size \(24\) does not match output size \(25\)/
    );
  });

  it('rejects first layer that does not have 400 inputs', () => {
    const data = {
      W1: Array.from({ length: 100 }, () => new Array(25).fill(0.01)),
      b1: new Array(25).fill(0.1),
      W2: Array.from({ length: 25 }, () => new Array(1).fill(0.05)),
      b2: [0.2],
    };
    expect(() => parseWeights(data)).toThrowError(
      /First layer must have 400 inputs \(got 100\)/
    );
  });

  it('rejects last layer that does not have 1 output', () => {
    const data = {
      W1: Array.from({ length: 400 }, () => new Array(25).fill(0.01)),
      b1: new Array(25).fill(0.1),
      W2: Array.from({ length: 25 }, () => new Array(2).fill(0.05)),
      b2: [0.2, 0.3],
    };
    expect(() => parseWeights(data)).toThrowError(
      /Last layer must have 1 output \(got 2\)/
    );
  });

  it('rejects inconsistent shapes between adjacent layers', () => {
    const data = {
      W1: Array.from({ length: 400 }, () => new Array(20).fill(0.01)),
      b1: new Array(20).fill(0.1),
      W2: Array.from({ length: 15 }, () => new Array(1).fill(0.05)), // 15 vs 20
      b2: [0.2],
    };
    expect(() => parseWeights(data)).toThrowError(
      /Layer 2 expects 15 inputs, but layer 1 outputs 20/
    );
  });
});

describe('Digit Engine: forward pass on a tiny hand-computed network', () => {
  it('computes exact forward propagation math', () => {
    // Hand-crafted network:
    // Input vector length 400, only x0 = 1.0, rest 0
    const features = new Float32Array(400);
    features[0] = 1.0;

    // Layer 1 (ReLU): 400 -> 2
    // W1 row 0 = [2.0, -3.0], all other rows 0.0
    // b1 = [-1.0, 2.0]
    // Z1 = [1.0 * 2.0 + (-1.0), 1.0 * (-3.0) + 2.0] = [1.0, -1.0]
    // A1 = ReLU(Z1) = [1.0, 0.0]
    const W1 = new Float64Array(400 * 2);
    W1[0 * 2 + 0] = 2.0;
    W1[0 * 2 + 1] = -3.0;

    const layer1: LayerWeight = {
      nIn: 400,
      nOut: 2,
      weights: W1,
      bias: new Float64Array([-1.0, 2.0]),
      activation: 'relu',
    };

    // Layer 2 (Sigmoid): 2 -> 1
    // W2 = [[1.5], [-2.0]]
    // b2 = [0.5]
    // Z2 = 1.0 * 1.5 + 0.0 * (-2.0) + 0.5 = 2.0
    // A2 = sigmoid(2.0) = 1 / (1 + exp(-2)) ≈ 0.8807970779778823
    const W2 = new Float64Array([1.5, -2.0]);
    const layer2: LayerWeight = {
      nIn: 2,
      nOut: 1,
      weights: W2,
      bias: new Float64Array([0.5]),
      activation: 'sigmoid',
    };

    const yHat = forward([layer1, layer2], features);
    const expectedSigmoid2 = 1.0 / (1.0 + Math.exp(-2.0));
    expect(yHat).toBeCloseTo(expectedSigmoid2, 8);

    const res = predict([layer1, layer2], features, true);
    expect(res.prob1).toBeCloseTo(expectedSigmoid2, 8);
    expect(res.prob0).toBeCloseTo(1 - expectedSigmoid2, 8);
    expect(res.predictedClass).toBe(1);
    expect(res.confidence).toBeCloseTo(expectedSigmoid2 * 100, 6);
  });
});

describe('Digit Engine Parity with model_weights.json on dataset samples', () => {
  it('correctly predicts the 4 bundled dataset samples with high confidence', () => {
    const weightsPath = path.resolve(process.cwd(), 'public', 'model_weights.json');
    const samplesPath = path.resolve(process.cwd(), 'src', 'data', 'digitSamples.json');

    if (!fs.existsSync(weightsPath) || !fs.existsSync(samplesPath)) {
      console.warn('Skipping dataset parity test because files are not found.');
      return;
    }

    const weightsJson = JSON.parse(fs.readFileSync(weightsPath, 'utf-8'));
    const samples = JSON.parse(fs.readFileSync(samplesPath, 'utf-8')) as Record<
      string,
      { label: number; pixels: number[] }
    >;

    const model = parseWeights(weightsJson);
    expect(model.layers.length).toBe(3);
    expect(model.architectureSummary).toBe('400 → 25 → 15 → 1');

    for (const [sampleKey, sampleData] of Object.entries(samples)) {
      const features = new Float32Array(sampleData.pixels);
      const result = predict(model.layers, features, true);

      // Verify each sample is predicted as its own label
      expect(result.predictedClass).toBe(sampleData.label);
      expect(result.confidence).toBeGreaterThan(99.0);

      if (sampleData.label === 0) {
        expect(result.prob0).toBeGreaterThan(0.999);
      } else {
        expect(result.prob1).toBeGreaterThan(0.999);
      }

      console.log(
        `✓ ${sampleKey}: true=${sampleData.label}, pred=${result.predictedClass}, conf=${result.confidence.toFixed(2)}%`
      );
    }
  });
});
