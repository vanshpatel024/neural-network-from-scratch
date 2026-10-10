import { create } from 'zustand';
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

export interface HistoryPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface PresetStory {
  id: string;
  title: string;
  explanation: string;
  dataset: DatasetType;
  noise: number;
  hiddenLayers: number[];
  activation: ActivationType;
  initType: InitType;
  learningRate: number;
  batchSize: number;
}

export interface PlaygroundState {
  // Model & data configs
  dataset: DatasetType;
  noise: number;
  seed: number;
  hiddenLayers: number[]; // e.g. [8, 4]
  activation: ActivationType;
  initType: InitType;
  learningRate: number;
  batchSize: number;
  speed: number; // epochs per second
  selectedClassToAdd: 0 | 1;
  activePresetId: string | null;
  loadedPresetName: string | null;
  addPointsMode: 'off' | 'class0' | 'class1';
  activeTab: 'settings' | 'charts' | 'network' | 'neurons';
  activeChart: 'loss' | 'accuracy';
  isAdvancedOpen: boolean;

  // Runtime training states
  isTraining: boolean;
  epoch: number;
  loss: number;
  accuracy: number;
  history: HistoryPoint[];
  points: Point2D[];
  weights: LayerWeightsSnapshot[];
  grid: DecisionBoundaryGrid | null;
  neuronsSnapshot: NetworkNeuronsSnapshot | null;
  selectedNeuronLayerIndex: number;

  // Actions
  setDataset: (dataset: DatasetType) => void;
  setNoise: (noise: number) => void;
  setSeed: (seed: number) => void;
  setHiddenLayersCount: (count: number) => void;
  setNeuronCount: (layerIndex: number, count: number) => void;
  setActivation: (activation: ActivationType) => void;
  setInitType: (initType: InitType) => void;
  setLearningRate: (lr: number) => void;
  setBatchSize: (size: number) => void;
  setSpeed: (speed: number) => void;
  setSelectedClassToAdd: (cls: 0 | 1) => void;
  setAddPointsMode: (mode: 'off' | 'class0' | 'class1') => void;
  setActiveTab: (tab: 'settings' | 'charts' | 'network' | 'neurons') => void;
  setActiveChart: (chart: 'loss' | 'accuracy') => void;
  setIsAdvancedOpen: (open: boolean) => void;
  setIsTraining: (isTraining: boolean) => void;
  setSelectedNeuronLayerIndex: (index: number) => void;
  updateMetrics: (
    metrics: EpochMetrics,
    weights: LayerWeightsSnapshot[],
    grid: DecisionBoundaryGrid,
    neuronsSnapshot?: NetworkNeuronsSnapshot
  ) => void;
  setFullState: (
    metrics: EpochMetrics,
    weights: LayerWeightsSnapshot[],
    grid: DecisionBoundaryGrid,
    points: Point2D[],
    isTraining: boolean,
    neuronsSnapshot?: NetworkNeuronsSnapshot
  ) => void;
  addPoint: (point: Point2D) => void;
  applyPreset: (preset: PresetStory) => void;
  resetToDefaults: () => void;
  resetHistory: () => void;
}

export const PRESETS: PresetStory[] = [
  {
    id: 'xor-needs-hidden',
    title: 'Why XOR needs a hidden layer',
    explanation:
      'A single linear line cannot separate diagonal quadrants without a hidden layer.',
    dataset: 'xor',
    noise: 0.05,
    hiddenLayers: [], // 0 hidden layers! Linear model
    activation: 'tanh',
    initType: 'xavier',
    learningRate: 0.3,
    batchSize: 16,
  },
  {
    id: 'learning-rate-high',
    title: 'Learning rate too high',
    explanation:
      'Huge steps cause weight updates to overshoot the valley and diverge.',
    dataset: 'moons',
    noise: 0.1,
    hiddenLayers: [8, 4],
    activation: 'tanh',
    initType: 'xavier',
    learningRate: 5.0, // Deliberately huge learning rate!
    batchSize: 16,
  },
  {
    id: 'bad-initialization',
    title: 'Bad initialization',
    explanation:
      'All neurons start with zero weights, receive identical gradients, and never specialize.',
    dataset: 'circles',
    noise: 0.1,
    hiddenLayers: [8, 4],
    activation: 'relu',
    initType: 'zeros', // Zeros initialization!
    learningRate: 0.2,
    batchSize: 16,
  },
];

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  dataset: 'moons',
  noise: 0.1,
  seed: 42,
  hiddenLayers: [8, 4],
  activation: 'tanh',
  initType: 'xavier',
  learningRate: 0.2,
  batchSize: 16,
  speed: 25,
  selectedClassToAdd: 0,
  activePresetId: null,
  loadedPresetName: null,
  addPointsMode: 'off',
  activeTab: 'settings',
  activeChart: 'loss',
  isAdvancedOpen: false,

  isTraining: false,
  epoch: 0,
  loss: 0,
  accuracy: 0,
  history: [],
  points: [],
  weights: [],
  grid: null,
  neuronsSnapshot: null,
  selectedNeuronLayerIndex: 0,

  setDataset: (dataset) => set({ dataset, activePresetId: null, loadedPresetName: null }),
  setNoise: (noise) => set({ noise, activePresetId: null }),
  setSeed: (seed) => set({ seed }),

  setHiddenLayersCount: (count) =>
    set((state) => {
      const current = [...state.hiddenLayers];
      if (count > current.length) {
        while (current.length < count) {
          current.push(4);
        }
      } else {
        current.length = count;
      }
      return { hiddenLayers: current, activePresetId: null, loadedPresetName: null };
    }),

  setNeuronCount: (layerIndex, count) =>
    set((state) => {
      const current = [...state.hiddenLayers];
      if (layerIndex >= 0 && layerIndex < current.length) {
        current[layerIndex] = Math.max(1, Math.min(16, count));
      }
      return { hiddenLayers: current, activePresetId: null, loadedPresetName: null };
    }),

  setActivation: (activation) => set({ activation, activePresetId: null, loadedPresetName: null }),
  setInitType: (initType) => set({ initType, activePresetId: null, loadedPresetName: null }),
  setLearningRate: (learningRate) => set({ learningRate }),
  setBatchSize: (batchSize) => set({ batchSize }),
  setSpeed: (speed) => set({ speed }),
  setSelectedClassToAdd: (selectedClassToAdd) =>
    set({
      selectedClassToAdd,
      addPointsMode: selectedClassToAdd === 0 ? 'class0' : 'class1',
    }),
  setAddPointsMode: (mode) =>
    set({
      addPointsMode: mode,
      selectedClassToAdd: mode === 'class1' ? 1 : 0,
    }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveChart: (activeChart) => set({ activeChart }),
  setIsAdvancedOpen: (isAdvancedOpen) => set({ isAdvancedOpen }),
  setIsTraining: (isTraining) => set({ isTraining }),
  setSelectedNeuronLayerIndex: (selectedNeuronLayerIndex) => set({ selectedNeuronLayerIndex }),

  updateMetrics: (metrics, weights, grid, neuronsSnapshot) =>
    set((state) => {
      const newPoint: HistoryPoint = {
        epoch: metrics.epoch,
        loss: Math.round(metrics.loss * 1000) / 1000,
        accuracy: Math.round(metrics.accuracy * 10) / 10,
      };

      let newHistory = [...state.history, newPoint];
      // Keep up to 120 points for smooth performance
      if (newHistory.length > 120) {
        newHistory = newHistory.filter(
          (_, idx) => idx % 2 === 0 || idx === newHistory.length - 1
        );
      }

      const activeNeuronsSnapshot =
        neuronsSnapshot !== undefined ? neuronsSnapshot : state.neuronsSnapshot;

      return {
        epoch: metrics.epoch,
        loss: metrics.loss,
        accuracy: metrics.accuracy,
        weights,
        grid,
        neuronsSnapshot: activeNeuronsSnapshot,
        history: newHistory,
      };
    }),

  setFullState: (metrics, weights, grid, points, isTraining, neuronsSnapshot) =>
    set({
      epoch: metrics.epoch,
      loss: metrics.loss,
      accuracy: metrics.accuracy,
      weights,
      grid,
      points,
      isTraining,
      neuronsSnapshot: neuronsSnapshot ?? null,
      history: [
        {
          epoch: metrics.epoch,
          loss: Math.round(metrics.loss * 1000) / 1000,
          accuracy: Math.round(metrics.accuracy * 10) / 10,
        },
      ],
    }),

  addPoint: (point) =>
    set((state) => ({
      points: [...state.points, point],
    })),

  applyPreset: (preset) =>
    set({
      dataset: preset.dataset,
      noise: preset.noise,
      hiddenLayers: preset.hiddenLayers,
      activation: preset.activation,
      initType: preset.initType,
      learningRate: preset.learningRate,
      batchSize: preset.batchSize,
      activePresetId: preset.id,
      loadedPresetName: preset.title,
      neuronsSnapshot: null,
      selectedNeuronLayerIndex: 0,
    }),

  resetToDefaults: () =>
    set({
      dataset: 'moons',
      noise: 0.1,
      hiddenLayers: [8, 4],
      activation: 'tanh',
      initType: 'xavier',
      learningRate: 0.2,
      batchSize: 16,
      speed: 25,
      activePresetId: null,
      loadedPresetName: null,
      addPointsMode: 'off',
      neuronsSnapshot: null,
      selectedNeuronLayerIndex: 0,
    }),

  resetHistory: () =>
    set({
      epoch: 0,
      loss: 0,
      accuracy: 0,
      history: [],
      neuronsSnapshot: null,
      selectedNeuronLayerIndex: 0,
    }),
}));
