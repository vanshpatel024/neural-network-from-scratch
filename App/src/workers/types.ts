import type {
  ActivationType,
  DatasetType,
  DecisionBoundaryGrid,
  EpochMetrics,
  InitType,
  LayerWeightsSnapshot,
  Point2D,
} from '../lib/nn/types';
import type { NetworkNeuronsSnapshot } from '../lib/neuronsAnalysis';

export type WorkerCommand =
  | {
      type: 'INIT';
      payload: {
        architecture: number[];
        activation: ActivationType;
        initType: InitType;
        dataset: DatasetType;
        noise: number;
        lr: number;
        batchSize: number;
        speed: number;
        seed: number;
      };
    }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'STEP' }
  | {
      type: 'RESET';
      payload?: { seed?: number };
    }
  | {
      type: 'SET_HYPERPARAMS';
      payload: {
        lr?: number;
        batchSize?: number;
        speed?: number;
      };
    }
  | {
      type: 'SET_DATASET';
      payload: {
        dataset?: DatasetType;
        noise?: number;
        seed?: number;
        customPoints?: Point2D[];
      };
    }
  | {
      type: 'ADD_POINT';
      payload: Point2D;
    }
  | {
      type: 'SET_ARCHITECTURE';
      payload: {
        hiddenLayers: number[];
        activation: ActivationType;
        initType: InitType;
      };
    }
  | {
      type: 'SET_NEURONS_ACTIVE';
      payload: {
        active: boolean;
      };
    };

export type WorkerEvent =
  | {
      type: 'STATE_SNAPSHOT';
      payload: {
        epoch: number;
        metrics: EpochMetrics;
        weights: LayerWeightsSnapshot[];
        grid: DecisionBoundaryGrid;
        points: Point2D[];
        isTraining: boolean;
        neuronsSnapshot?: NetworkNeuronsSnapshot;
      };
    }
  | {
      type: 'METRICS_TICK';
      payload: {
        metrics: EpochMetrics;
        weights: LayerWeightsSnapshot[];
        grid: DecisionBoundaryGrid;
        neuronsSnapshot?: NetworkNeuronsSnapshot;
      };
    }
  | {
      type: 'TRAINING_STATUS';
      payload: {
        isTraining: boolean;
      };
    };
