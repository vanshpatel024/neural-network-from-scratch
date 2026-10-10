import type { ActivationType, InitType, LayerWeightsSnapshot } from './types';
import type { PRNG } from './prng';
import { activate, activateDerivative } from './activations';
import { initializeWeightsAndBiases } from './initializers';

export class DenseLayer {
  public inputDim: number;
  public outputDim: number;
  public activation: ActivationType;

  public weights: number[][]; // inputDim x outputDim
  public biases: number[]; // outputDim

  public gradWeights: number[][]; // inputDim x outputDim
  public gradBiases: number[]; // outputDim

  public lastInput: number[][] = [];
  public lastZ: number[][] = [];
  public lastA: number[][] = [];

  constructor(
    inputDim: number,
    outputDim: number,
    activation: ActivationType,
    initType: InitType,
    prng: PRNG
  ) {
    this.inputDim = inputDim;
    this.outputDim = outputDim;
    this.activation = activation;

    const init = initializeWeightsAndBiases(inputDim, outputDim, initType, prng);
    this.weights = init.weights;
    this.biases = init.biases;

    this.gradWeights = Array.from({ length: inputDim }, () =>
      new Array(outputDim).fill(0)
    );
    this.gradBiases = new Array(outputDim).fill(0);
  }

  forward(X: number[][]): number[][] {
    const B = X.length;
    this.lastInput = X;

    const Z: number[][] = [];
    const A: number[][] = [];

    for (let i = 0; i < B; i++) {
      const rowX = X[i]!;
      const rowZ: number[] = new Array(this.outputDim).fill(0);
      const rowA: number[] = new Array(this.outputDim).fill(0);

      for (let j = 0; j < this.outputDim; j++) {
        let sum = this.biases[j]!;
        for (let k = 0; k < this.inputDim; k++) {
          sum += rowX[k]! * this.weights[k]![j]!;
        }
        rowZ[j] = sum;
        rowA[j] = activate(sum, this.activation);
      }

      Z.push(rowZ);
      A.push(rowA);
    }

    this.lastZ = Z;
    this.lastA = A;
    return A;
  }

  /**
   * Backpropagates from pre-activation gradient dZ (shape B x outputDim).
   * Computes parameter gradients dW, db and returns input gradient dX (shape B x inputDim).
   */
  backwardDZ(dZ: number[][]): number[][] {
    const B = this.lastInput.length;
    const dX: number[][] = Array.from({ length: B }, () =>
      new Array(this.inputDim).fill(0)
    );

    // Reset parameter gradients
    for (let j = 0; j < this.outputDim; j++) {
      this.gradBiases[j] = 0;
      for (let k = 0; k < this.inputDim; k++) {
        this.gradWeights[k]![j] = 0;
      }
    }

    // Accumulate dW, db and calculate dX
    for (let i = 0; i < B; i++) {
      const rowX = this.lastInput[i]!;
      const rowDZ = dZ[i]!;
      const rowDX = dX[i]!;

      for (let j = 0; j < this.outputDim; j++) {
        const dz = rowDZ[j]!;
        this.gradBiases[j]! += dz;

        for (let k = 0; k < this.inputDim; k++) {
          this.gradWeights[k]![j]! += rowX[k]! * dz;
          rowDX[k]! += dz * this.weights[k]![j]!;
        }
      }

    }

    return dX;
  }

  /**
   * Backpropagates from activation gradient dA (shape B x outputDim).
   * Computes dZ = dA * f'(Z), then backpropagates dZ.
   */
  backward(dA: number[][]): number[][] {
    const B = dA.length;
    const dZ: number[][] = [];

    for (let i = 0; i < B; i++) {
      const rowDA = dA[i]!;
      const rowZ = this.lastZ[i]!;
      const rowA = this.lastA[i]!;
      const rowDZ: number[] = new Array(this.outputDim);

      for (let j = 0; j < this.outputDim; j++) {
        const deriv = activateDerivative(rowZ[j]!, this.activation, rowA[j]!);
        rowDZ[j] = rowDA[j]! * deriv;
      }
      dZ.push(rowDZ);
    }

    return this.backwardDZ(dZ);
  }

  /**
   * Updates weights and biases using accumulated gradients.
   */
  applyGradients(learningRate: number): void {
    for (let k = 0; k < this.inputDim; k++) {
      const wRow = this.weights[k]!;
      const gwRow = this.gradWeights[k]!;
      for (let j = 0; j < this.outputDim; j++) {
        wRow[j]! -= learningRate * gwRow[j]!;
      }
    }

    for (let j = 0; j < this.outputDim; j++) {
      this.biases[j]! -= learningRate * this.gradBiases[j]!;
    }
  }


  getSnapshot(layerIndex: number): LayerWeightsSnapshot {
    return {
      layerIndex,
      inputDim: this.inputDim,
      outputDim: this.outputDim,
      activation: this.activation,
      weights: this.weights.map((row) => [...row]),
      biases: [...this.biases],
    };
  }
}
