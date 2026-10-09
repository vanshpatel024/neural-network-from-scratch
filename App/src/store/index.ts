import { create } from 'zustand';

export type ActivationType = 'relu' | 'sigmoid';

export interface TrainingMetric {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface AppState {
  // Model Hyperparameters
  inputDim: number;
  hidden1Dim: number;
  hidden2Dim: number;
  outputDim: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
  hiddenActivation: ActivationType;

  // Runtime State
  isTraining: boolean;
  isPaused: boolean;
  currentEpoch: number;
  currentLoss: number | null;
  currentAccuracy: number | null;
  history: TrainingMetric[];

  // Actions
  setLearningRate: (lr: number) => void;
  setBatchSize: (bs: number) => void;
  setEpochs: (epochs: number) => void;
  setHidden1Dim: (dim: number) => void;
  setHidden2Dim: (dim: number) => void;
  setHiddenActivation: (act: ActivationType) => void;
  setIsTraining: (training: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  recordStep: (metric: TrainingMetric) => void;
  resetTraining: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Defaults matching the Python project (400 -> 25 -> 15 -> 1)
  inputDim: 400,
  hidden1Dim: 25,
  hidden2Dim: 15,
  outputDim: 1,
  learningRate: 0.1,
  batchSize: 16,
  epochs: 20,
  hiddenActivation: 'relu',

  isTraining: false,
  isPaused: false,
  currentEpoch: 0,
  currentLoss: null,
  currentAccuracy: null,
  history: [],

  setLearningRate: (lr: number): void => set({ learningRate: lr }),
  setBatchSize: (bs: number): void => set({ batchSize: bs }),
  setEpochs: (epochs: number): void => set({ epochs }),
  setHidden1Dim: (dim: number): void => set({ hidden1Dim: dim }),
  setHidden2Dim: (dim: number): void => set({ hidden2Dim: dim }),
  setHiddenActivation: (act: ActivationType): void =>
    set({ hiddenActivation: act }),
  setIsTraining: (training: boolean): void => set({ isTraining: training }),
  setIsPaused: (paused: boolean): void => set({ isPaused: paused }),
  recordStep: (metric: TrainingMetric): void =>
    set((state) => ({
      currentEpoch: metric.epoch,
      currentLoss: metric.loss,
      currentAccuracy: metric.accuracy,
      history: [...state.history, metric],
    })),
  resetTraining: (): void =>
    set({
      isTraining: false,
      isPaused: false,
      currentEpoch: 0,
      currentLoss: null,
      currentAccuracy: null,
      history: [],
    }),
}));
