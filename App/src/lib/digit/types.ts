export interface LayerWeight {
  nIn: number;
  nOut: number;
  /** Flattened row-major weights: weights[i * nOut + j] */
  weights: Float64Array;
  /** Bias vector of length nOut */
  bias: Float64Array;
  activation: 'relu' | 'sigmoid';
}

export interface ParsedModel {
  layers: LayerWeight[];
  architectureSummary: string;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  hasInk: boolean;
}

export interface PredictionResult {
  features: Float32Array;
  hasInk: boolean;
  prob0: number;
  prob1: number;
  predictedClass: 0 | 1;
  confidence: number; // Percentage [0..100]
  latencyMs: number;
  rawOutput: number;
}
