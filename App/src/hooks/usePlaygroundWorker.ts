import { useEffect, useRef, useCallback } from 'react';
import { usePlaygroundStore, type PresetStory } from '../store/playgroundStore';
import type { WorkerCommand, WorkerEvent } from '../workers/types';
import type { Point2D } from '../lib/nn/types';

export function usePlaygroundWorker() {
  const workerRef = useRef<Worker | null>(null);

  const dataset = usePlaygroundStore((s) => s.dataset);
  const noise = usePlaygroundStore((s) => s.noise);
  const seed = usePlaygroundStore((s) => s.seed);
  const hiddenLayers = usePlaygroundStore((s) => s.hiddenLayers);
  const activation = usePlaygroundStore((s) => s.activation);
  const initType = usePlaygroundStore((s) => s.initType);
  const learningRate = usePlaygroundStore((s) => s.learningRate);
  const batchSize = usePlaygroundStore((s) => s.batchSize);
  const speed = usePlaygroundStore((s) => s.speed);

  const setIsTraining = usePlaygroundStore((s) => s.setIsTraining);
  const updateMetrics = usePlaygroundStore((s) => s.updateMetrics);
  const setFullState = usePlaygroundStore((s) => s.setFullState);
  const setSeed = usePlaygroundStore((s) => s.setSeed);
  const applyPresetStore = usePlaygroundStore((s) => s.applyPreset);

  const send = useCallback((cmd: WorkerCommand) => {
    if (workerRef.current) {
      workerRef.current.postMessage(cmd);
    }
  }, []);

  const activeTab = usePlaygroundStore((s) => s.activeTab);

  // Initialize worker on mount, clean up on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/trainer.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerEvent>) => {
      const event = e.data;
      switch (event.type) {
        case 'STATE_SNAPSHOT':
          setFullState(
            event.payload.metrics,
            event.payload.weights,
            event.payload.grid,
            event.payload.points,
            event.payload.isTraining,
            event.payload.neuronsSnapshot
          );
          break;
        case 'METRICS_TICK':
          updateMetrics(
            event.payload.metrics,
            event.payload.weights,
            event.payload.grid,
            event.payload.neuronsSnapshot
          );
          break;
        case 'TRAINING_STATUS':
          setIsTraining(event.payload.isTraining);
          break;
      }
    };

    // Initial configuration
    worker.postMessage({
      type: 'INIT',
      payload: {
        architecture: hiddenLayers,
        activation,
        initType,
        dataset,
        noise,
        lr: learningRate,
        batchSize,
        speed,
        seed,
      },
    } satisfies WorkerCommand);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update hyperparams when lr, batchSize, or speed change
  useEffect(() => {
    send({
      type: 'SET_HYPERPARAMS',
      payload: { lr: learningRate, batchSize, speed },
    });
  }, [learningRate, batchSize, speed, send]);

  // Notify worker when Neurons tab is active so it computes neuron grids
  useEffect(() => {
    send({
      type: 'SET_NEURONS_ACTIVE',
      payload: { active: activeTab === 'neurons' },
    });
  }, [activeTab, send]);

  // Update dataset when dataset or noise change
  const prevDatasetRef = useRef(dataset);
  const prevNoiseRef = useRef(noise);
  const prevSeedRef = useRef(seed);

  useEffect(() => {
    if (
      prevDatasetRef.current !== dataset ||
      prevNoiseRef.current !== noise ||
      prevSeedRef.current !== seed
    ) {
      prevDatasetRef.current = dataset;
      prevNoiseRef.current = noise;
      prevSeedRef.current = seed;
      send({
        type: 'SET_DATASET',
        payload: { dataset, noise, seed },
      });
    }
  }, [dataset, noise, seed, send]);

  // Update architecture when hiddenLayers, activation, or initType change
  const prevArchRef = useRef({ hiddenLayers, activation, initType });
  useEffect(() => {
    const current = { hiddenLayers, activation, initType };
    if (
      JSON.stringify(prevArchRef.current.hiddenLayers) !==
        JSON.stringify(hiddenLayers) ||
      prevArchRef.current.activation !== activation ||
      prevArchRef.current.initType !== initType
    ) {
      prevArchRef.current = current;
      send({
        type: 'SET_ARCHITECTURE',
        payload: { hiddenLayers, activation, initType },
      });
    }
  }, [hiddenLayers, activation, initType, send]);

  const start = useCallback(() => {
    send({ type: 'START' });
  }, [send]);

  const pause = useCallback(() => {
    send({ type: 'PAUSE' });
  }, [send]);

  const step = useCallback(() => {
    send({ type: 'STEP' });
  }, [send]);

  const reset = useCallback(() => {
    send({ type: 'RESET', payload: { seed } });
  }, [send, seed]);

  const randomizeSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    send({
      type: 'SET_DATASET',
      payload: { dataset, noise, seed: newSeed },
    });
    send({
      type: 'RESET',
      payload: { seed: newSeed },
    });
  }, [dataset, noise, setSeed, send]);

  const addPoint = useCallback(
    (point: Point2D) => {
      send({
        type: 'ADD_POINT',
        payload: point,
      });
    },
    [send]
  );

  const applyPreset = useCallback(
    (preset: PresetStory) => {
      applyPresetStore(preset);
      send({
        type: 'INIT',
        payload: {
          architecture: preset.hiddenLayers,
          activation: preset.activation,
          initType: preset.initType,
          dataset: preset.dataset,
          noise: preset.noise,
          lr: preset.learningRate,
          batchSize: preset.batchSize,
          speed,
          seed,
        },
      });
    },
    [applyPresetStore, send, speed, seed]
  );

  const resetToDefaultsStore = usePlaygroundStore((s) => s.resetToDefaults);
  const resetToDefaults = useCallback(() => {
    resetToDefaultsStore();
    send({
      type: 'INIT',
      payload: {
        architecture: [8, 4],
        activation: 'tanh',
        initType: 'xavier',
        dataset: 'moons',
        noise: 0.1,
        lr: 0.2,
        batchSize: 16,
        speed: 25,
        seed: 42,
      },
    });
  }, [resetToDefaultsStore, send]);

  return {
    start,
    pause,
    step,
    reset,
    randomizeSeed,
    addPoint,
    applyPreset,
    resetToDefaults,
  };
}

