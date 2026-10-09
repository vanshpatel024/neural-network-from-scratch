import { create } from 'zustand';

export interface AppState {
  learningRate: number;
  batchSize: number;
  epochs: number;
  isTraining: boolean;
  setLearningRate: (lr: number) => void;
  setBatchSize: (bs: number) => void;
  setEpochs: (epochs: number) => void;
  setIsTraining: (training: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  learningRate: 0.1,
  batchSize: 16,
  epochs: 20,
  isTraining: false,
  setLearningRate: (lr: number): void => set({ learningRate: lr }),
  setBatchSize: (bs: number): void => set({ batchSize: bs }),
  setEpochs: (epochs: number): void => set({ epochs }),
  setIsTraining: (training: boolean): void => set({ isTraining: training }),
}));
