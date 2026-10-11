import { create } from 'zustand';
import type { ParsedModel, PredictionResult } from '@/lib/digit/types';
import { parseWeights } from '@/lib/digit/parseWeights';

export type ModelStatus = 'loading' | 'ready' | 'error' | 'custom';

export interface DigitModelState {
  status: ModelStatus;
  model: ParsedModel | null;
  errorMessage: string | null;
  sourceName: string;
  defaultWeightsJson: unknown | null;

  // Session state preserved across route changes
  brushSize: number;
  autoCenter: boolean;
  canvasSnapshot: string | null;
  activePresetKey: string | null;
  predictionResult: PredictionResult | null;

  // Actions
  initModel: () => Promise<void>;
  loadCustomWeights: (data: unknown, filename: string) => boolean;
  restoreDefaultModel: () => Promise<void>;
  setBrushSize: (size: number) => void;
  setAutoCenter: (autoCenter: boolean) => void;
  setCanvasSnapshot: (snapshot: string | null) => void;
  setActivePresetKey: (key: string | null) => void;
  setPredictionResult: (res: PredictionResult | null) => void;
  clearError: () => void;
}

export const useDigitModelStore = create<DigitModelState>((set, get) => ({
  status: 'loading',
  model: null,
  errorMessage: null,
  sourceName: 'model_weights.json',
  defaultWeightsJson: null,

  brushSize: 22,
  autoCenter: true,
  canvasSnapshot: null,
  activePresetKey: null,
  predictionResult: null,

  initModel: async () => {
    // If already loaded or custom, keep current state
    const current = get();
    if (current.status === 'ready' || current.status === 'custom') {
      return;
    }

    set({ status: 'loading', errorMessage: null });

    const baseUrl = import.meta.env.BASE_URL ?? '/';
    const weightsUrl = `${baseUrl.replace(/\/$/, '')}/model_weights.json`;

    try {
      const res = await fetch(weightsUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch model weights (${res.status} ${res.statusText})`);
      }

      const json = await res.json();
      const parsed = parseWeights(json);

      set({
        status: 'ready',
        model: parsed,
        defaultWeightsJson: json,
        sourceName: 'model_weights.json',
        errorMessage: null,
      });
    } catch (err) {
      console.warn('[DigitModelStore] Could not load bundled weights:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load model weights file.';
      set({
        status: 'error',
        model: null,
        errorMessage: msg,
        sourceName: 'None',
      });
    }
  },

  loadCustomWeights: (data: unknown, filename: string) => {
    try {
      const parsed = parseWeights(data);
      set({
        status: 'custom',
        model: parsed,
        sourceName: filename,
        errorMessage: null,
      });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid weights JSON.';
      set({
        errorMessage: msg,
      });
      return false;
    }
  },

  restoreDefaultModel: async () => {
    const { defaultWeightsJson } = get();
    if (defaultWeightsJson) {
      try {
        const parsed = parseWeights(defaultWeightsJson);
        set({
          status: 'ready',
          model: parsed,
          sourceName: 'model_weights.json',
          errorMessage: null,
        });
        return;
      } catch {
        // Fallback to fetch
      }
    }

    // Otherwise re-fetch
    set({ status: 'loading', model: null, errorMessage: null });
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    const weightsUrl = `${baseUrl.replace(/\/$/, '')}/model_weights.json`;

    try {
      const res = await fetch(weightsUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch bundled model weights (${res.status})`);
      }
      const json = await res.json();
      const parsed = parseWeights(json);
      set({
        status: 'ready',
        model: parsed,
        defaultWeightsJson: json,
        sourceName: 'model_weights.json',
        errorMessage: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not restore default model.';
      set({
        status: 'error',
        model: null,
        errorMessage: msg,
        sourceName: 'None',
      });
    }
  },

  setBrushSize: (brushSize: number) => set({ brushSize }),
  setAutoCenter: (autoCenter: boolean) => set({ autoCenter }),
  setCanvasSnapshot: (canvasSnapshot: string | null) => set({ canvasSnapshot }),
  setActivePresetKey: (activePresetKey: string | null) => set({ activePresetKey }),
  setPredictionResult: (predictionResult: PredictionResult | null) => set({ predictionResult }),
  clearError: () => set({ errorMessage: null }),
}));
