import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().resetTraining();
  });

  it('has initial default hyperparameters matching the python architecture', () => {
    const state = useAppStore.getState();
    expect(state.inputDim).toBe(400);
    expect(state.hidden1Dim).toBe(25);
    expect(state.hidden2Dim).toBe(15);
    expect(state.outputDim).toBe(1);
    expect(state.learningRate).toBe(0.1);
    expect(state.batchSize).toBe(16);
  });

  it('updates hyperparameters correctly', () => {
    useAppStore.getState().setLearningRate(0.01);
    expect(useAppStore.getState().learningRate).toBe(0.01);

    useAppStore.getState().setBatchSize(32);
    expect(useAppStore.getState().batchSize).toBe(32);
  });

  it('records training metric steps', () => {
    useAppStore.getState().recordStep({ epoch: 1, loss: 0.45, accuracy: 85.5 });
    const state = useAppStore.getState();
    expect(state.currentEpoch).toBe(1);
    expect(state.currentLoss).toBe(0.45);
    expect(state.currentAccuracy).toBe(85.5);
    expect(state.history.length).toBe(1);
  });
});
