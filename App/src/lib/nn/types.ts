export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'linear';

export type InitType = 'zeros' | 'random' | 'xavier' | 'he';

export type DatasetType = 'moons' | 'circles' | 'xor' | 'blobs' | 'spiral';

export interface Point2D {
  x: number;
  y: number;
  label: 0 | 1;
}

export interface DatasetResult {
  points: Point2D[];
  X: number[][]; // N x 2
  y: number[][]; // N x 1
}

export interface LayerWeightsSnapshot {
  layerIndex: number;
  inputDim: number;
  outputDim: number;
  activation: ActivationType;
  weights: number[][]; // inputDim x outputDim
  biases: number[]; // outputDim
}

export interface NetworkConfig {
  inputDim: number;
  hiddenLayers: number[]; // e.g. [8, 4]
  outputDim: number; // 1 for binary classification
  activation: ActivationType;
  initType: InitType;
  seed?: number;
}

export interface DecisionBoundaryGrid {
  resolution: number; // e.g. 40
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  probabilities: number[]; // Flattened resolution * resolution array of probabilities
}

export interface EpochMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
}
