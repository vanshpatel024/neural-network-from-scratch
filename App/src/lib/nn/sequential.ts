import type {
  ActivationType,
  DecisionBoundaryGrid,
  LayerWeightsSnapshot,
  NetworkConfig,
} from './types';
import { PRNG } from './prng';
import { DenseLayer } from './layer';

export class Sequential {
  public layers: DenseLayer[] = [];
  public config: NetworkConfig;
  public prng: PRNG;

  constructor(config: NetworkConfig) {
    this.config = config;
    this.prng = new PRNG(config.seed ?? 42);
    this.build();
  }

  public build(): void {
    this.layers = [];
    const dims = [
      this.config.inputDim,
      ...this.config.hiddenLayers,
      this.config.outputDim,
    ];

    for (let i = 0; i < dims.length - 1; i++) {
      const inDim = dims[i]!;
      const outDim = dims[i + 1]!;
      const isOutput = i === dims.length - 2;

      // Hidden layers use chosen activation; binary output layer uses sigmoid
      const activation: ActivationType = isOutput
        ? 'sigmoid'
        : this.config.activation;

      const layer = new DenseLayer(
        inDim,
        outDim,
        activation,
        this.config.initType,
        this.prng
      );
      this.layers.push(layer);
    }
  }

  /**
   * Forward pass through all layers.
   */
  forward(X: number[][]): number[][] {
    let current = X;
    for (const layer of this.layers) {
      current = layer.forward(current);
    }
    return current;
  }

  /**
   * Backward pass for BCE loss with sigmoid output.
   * Computes exact parameter gradients dL/dTheta across all layers.
   */
  backward(yTrue: number[][]): void {
    if (this.layers.length === 0) return;

    const B = yTrue.length;
    if (B === 0) return;

    const outputLayer = this.layers[this.layers.length - 1]!;
    const yPred = outputLayer.lastA;

    // Error gradient for output layer with sigmoid activation and BCE loss:
    // dZ_out = (1 / B) * (yPred - yTrue)
    const dZOut: number[][] = [];
    const invB = 1 / B;

    for (let i = 0; i < B; i++) {
      const rowDZ: number[] = new Array(outputLayer.outputDim);
      for (let j = 0; j < outputLayer.outputDim; j++) {
        rowDZ[j] = (yPred[i]![j]! - yTrue[i]![j]!) * invB;
      }
      dZOut.push(rowDZ);
    }

    // Backprop through output layer
    let currentGrad = outputLayer.backwardDZ(dZOut);

    // Backprop through hidden layers in reverse
    for (let i = this.layers.length - 2; i >= 0; i--) {
      currentGrad = this.layers[i]!.backward(currentGrad);
    }
  }

  /**
   * Applies SGD parameter updates to all layers.
   */
  update(learningRate: number): void {
    for (const layer of this.layers) {
      layer.applyGradients(learningRate);
    }
  }

  /**
   * Predicts output probabilities for input matrix X.
   */
  predict(X: number[][]): number[][] {
    return this.forward(X);
  }

  /**
   * Returns current snapshot of all layer weights and biases.
   */
  getSnapshots(): LayerWeightsSnapshot[] {
    return this.layers.map((layer, idx) => layer.getSnapshot(idx));
  }

  /**
   * Gets a deep copy of all model parameters (for gradient checking).
   */
  getParameters(): Array<{ weights: number[][]; biases: number[] }> {
    return this.layers.map((layer) => ({
      weights: layer.weights.map((row) => [...row]),
      biases: [...layer.biases],
    }));
  }

  /**
   * Restores model parameters.
   */
  setParameters(
    params: Array<{ weights: number[][]; biases: number[] }>
  ): void {
    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l]!;
      const p = params[l]!;
      for (let i = 0; i < layer.inputDim; i++) {
        for (let j = 0; j < layer.outputDim; j++) {
          layer.weights[i]![j] = p.weights[i]![j]!;
        }
      }
      for (let j = 0; j < layer.outputDim; j++) {
        layer.biases[j] = p.biases[j]!;
      }
    }
  }

  /**
   * Evaluates the model over a 2D meshgrid to generate a decision boundary heatmap.
   */
  computeGrid(
    resolution = 40,
    bounds = { minX: -2, maxX: 2, minY: -2, maxY: 2 }
  ): DecisionBoundaryGrid {
    const { minX, maxX, minY, maxY } = bounds;
    const stepX = (maxX - minX) / (resolution - 1);
    const stepY = (maxY - minY) / (resolution - 1);

    const gridPoints: number[][] = [];
    for (let row = 0; row < resolution; row++) {
      const y = maxY - row * stepY; // top to bottom
      for (let col = 0; col < resolution; col++) {
        const x = minX + col * stepX; // left to right
        gridPoints.push([x, y]);
      }
    }

    const predictions = this.forward(gridPoints);
    const probabilities = predictions.map((p) => p[0]!);

    return {
      resolution,
      minX,
      maxX,
      minY,
      maxY,
      probabilities,
    };
  }
}
