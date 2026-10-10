import type { WorkerCommand, WorkerEvent } from './types';
import {
  Sequential,
  generateDataset,
  trainEpoch,
  PRNG,
  bceLoss,
  binaryAccuracy,
} from '../lib/nn';
import type {
  ActivationType,
  DatasetType,
  InitType,
  Point2D,
} from '../lib/nn/types';

// Worker state
let network: Sequential | null = null;
let points: Point2D[] = [];
let X: number[][] = [];
let y: number[][] = [];

let epoch = 0;
let isTraining = false;
let lr = 0.1;
let batchSize = 16;
let speed = 20; // epochs per second
let seed = 42;
let prng = new PRNG(seed);

import { evaluateNetworkNeurons, type NetworkNeuronsSnapshot } from '../lib/neuronsAnalysis';

let timerId: ReturnType<typeof setTimeout> | null = null;
let lastPostTime = 0;
let lastNeuronsTime = 0;
let isNeuronsActive = false;
const MIN_POST_INTERVAL_MS = 33.3; // ~30 fps throttle
const MIN_NEURONS_INTERVAL_MS = 120; // ~8 times per second max

function post(event: WorkerEvent): void {
  self.postMessage(event);
}

function computeState(forceNeurons = false) {
  if (!network) return null;
  const preds = network.forward(X);
  const loss = bceLoss(preds, y);
  const accuracy = binaryAccuracy(preds, y);
  const metrics = { epoch, loss, accuracy };
  const weights = network.getSnapshots();
  const grid = network.computeGrid(40);

  let neuronsSnapshot: NetworkNeuronsSnapshot | undefined;
  const now = performance.now();
  if ((forceNeurons || isNeuronsActive) && (forceNeurons || now - lastNeuronsTime >= MIN_NEURONS_INTERVAL_MS)) {
    neuronsSnapshot = evaluateNetworkNeurons(network, 24);
    lastNeuronsTime = now;
  }

  return { metrics, weights, grid, neuronsSnapshot };
}

function postFullState(forceNeurons = false): void {
  const state = computeState(forceNeurons || isNeuronsActive);
  if (!state) return;
  post({
    type: 'STATE_SNAPSHOT',
    payload: {
      epoch,
      metrics: state.metrics,
      weights: state.weights,
      grid: state.grid,
      points,
      isTraining,
      neuronsSnapshot: state.neuronsSnapshot,
    },
  });
}

function postTick(forceNeurons = false): void {
  const state = computeState(forceNeurons);
  if (!state) return;
  post({
    type: 'METRICS_TICK',
    payload: {
      metrics: state.metrics,
      weights: state.weights,
      grid: state.grid,
      neuronsSnapshot: state.neuronsSnapshot,
    },
  });
}


function runLoop(): void {
  if (!isTraining || !network) return;

  const now = performance.now();

  // Run at least 1 epoch, or batch epochs if speed is high
  const epochsToRun = Math.max(1, Math.round(speed / 30));
  for (let i = 0; i < epochsToRun; i++) {
    epoch++;
    trainEpoch(network, X, y, epoch, {
      learningRate: lr,
      batchSize,
      prng,
    });
  }

  // Throttle posts to ~30 fps
  if (now - lastPostTime >= MIN_POST_INTERVAL_MS) {
    postTick();
    lastPostTime = now;
  }

  // Calculate delay for next tick to match target epochs per second
  const targetDelayMs = Math.max(5, 1000 / Math.max(1, speed));
  timerId = setTimeout(runLoop, Math.min(targetDelayMs, 33));
}

function startTraining(): void {
  if (isTraining) return;
  isTraining = true;
  lastPostTime = performance.now();
  post({ type: 'TRAINING_STATUS', payload: { isTraining: true } });
  runLoop();
}

function pauseTraining(): void {
  if (!isTraining) return;
  isTraining = false;
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  post({ type: 'TRAINING_STATUS', payload: { isTraining: false } });
  postTick();
}

function stepEpoch(): void {
  if (!network) return;
  pauseTraining();
  epoch++;
  trainEpoch(network, X, y, epoch, {
    learningRate: lr,
    batchSize,
    prng,
  });
  postTick(true);
}


function initModel(payload: {
  architecture: number[];
  activation: ActivationType;
  initType: InitType;
  dataset: DatasetType;
  noise: number;
  lr: number;
  batchSize: number;
  speed: number;
  seed: number;
}): void {
  pauseTraining();

  seed = payload.seed;
  lr = payload.lr;
  batchSize = payload.batchSize;
  speed = payload.speed;
  epoch = 0;

  prng = new PRNG(seed);

  // Generate dataset
  const datasetResult = generateDataset(payload.dataset, 200, payload.noise, seed);
  points = datasetResult.points;
  X = datasetResult.X;
  y = datasetResult.y;

  // Build network
  network = new Sequential({
    inputDim: 2,
    hiddenLayers: payload.architecture,
    outputDim: 1,
    activation: payload.activation,
    initType: payload.initType,
    seed,
  });

  postFullState();
}

self.onmessage = (e: MessageEvent<WorkerCommand>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT':
      initModel(msg.payload);
      break;

    case 'START':
      startTraining();
      break;

    case 'PAUSE':
      pauseTraining();
      break;

    case 'STEP':
      stepEpoch();
      break;

    case 'RESET': {
      pauseTraining();
      epoch = 0;
      if (msg.payload?.seed !== undefined) {
        seed = msg.payload.seed;
      }
      prng = new PRNG(seed);
      if (network) {
        network.build();
      }
      postFullState();
      break;
    }

    case 'SET_HYPERPARAMS': {
      if (msg.payload.lr !== undefined) lr = msg.payload.lr;
      if (msg.payload.batchSize !== undefined) batchSize = msg.payload.batchSize;
      if (msg.payload.speed !== undefined) speed = msg.payload.speed;
      break;
    }

    case 'SET_DATASET': {
      const isRunning = isTraining;
      if (isRunning) pauseTraining();

      if (msg.payload.seed !== undefined) seed = msg.payload.seed;

      if (msg.payload.customPoints) {
        points = msg.payload.customPoints;
      } else if (msg.payload.dataset) {
        const res = generateDataset(
          msg.payload.dataset,
          200,
          msg.payload.noise ?? 0.1,
          seed
        );
        points = res.points;
      }

      X = points.map((p) => [p.x, p.y]);
      y = points.map((p) => [p.label]);

      if (isRunning) {
        startTraining();
      } else {
        postFullState();
      }
      break;
    }

    case 'ADD_POINT': {
      points.push(msg.payload);
      X.push([msg.payload.x, msg.payload.y]);
      y.push([msg.payload.label]);
      postFullState();
      break;
    }

    case 'SET_ARCHITECTURE': {
      const isRunning = isTraining;
      if (isRunning) pauseTraining();

      epoch = 0;
      network = new Sequential({
        inputDim: 2,
        hiddenLayers: msg.payload.hiddenLayers,
        outputDim: 1,
        activation: msg.payload.activation,
        initType: msg.payload.initType,
        seed,
      });

      if (isRunning) {
        startTraining();
      } else {
        postFullState();
      }
      break;
    }

    case 'SET_NEURONS_ACTIVE': {
      isNeuronsActive = msg.payload.active;
      if (isNeuronsActive) {
        postTick(true);
      }
      break;
    }
  }
};
