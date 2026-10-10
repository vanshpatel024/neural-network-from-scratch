import { describe, it, expect } from 'vitest';
import {
  detectTrainingStatus,
  TRAINING_STATE_MESSAGES,
} from './trainingStatus';

describe('detectTrainingStatus', () => {
  it('detects idle state before training begins', () => {
    const res = detectTrainingStatus([], false);
    expect(res.state).toBe('idle');
    expect(res.message).toBe(TRAINING_STATE_MESSAGES.idle);

    const resSingle = detectTrainingStatus(
      [{ epoch: 0, loss: 0.693, accuracy: 50 }],
      false
    );
    expect(resSingle.state).toBe('idle');
  });

  it('detects learning state during early and normal training with decreasing loss', () => {
    const history = [
      { epoch: 1, loss: 0.7, accuracy: 55 },
      { epoch: 2, loss: 0.65, accuracy: 60 },
      { epoch: 3, loss: 0.6, accuracy: 65 },
      { epoch: 4, loss: 0.55, accuracy: 70 },
      { epoch: 5, loss: 0.5, accuracy: 75 },
      { epoch: 6, loss: 0.45, accuracy: 80 },
    ];

    const res = detectTrainingStatus(history, true);
    expect(res.state).toBe('learning');
    expect(res.message).toBe(TRAINING_STATE_MESSAGES.learning);
  });

  it('detects converged state when loss flattens and accuracy is high', () => {
    const history = [
      { epoch: 40, loss: 0.051, accuracy: 96 },
      { epoch: 41, loss: 0.05, accuracy: 96 },
      { epoch: 42, loss: 0.049, accuracy: 97 },
      { epoch: 43, loss: 0.05, accuracy: 97 },
      { epoch: 44, loss: 0.048, accuracy: 97 },
      { epoch: 45, loss: 0.049, accuracy: 97 },
      { epoch: 46, loss: 0.048, accuracy: 97 },
      { epoch: 47, loss: 0.048, accuracy: 97 },
      { epoch: 48, loss: 0.048, accuracy: 97 },
      { epoch: 49, loss: 0.047, accuracy: 98 },
    ];

    const res = detectTrainingStatus(history, true);
    expect(res.state).toBe('converged');
    expect(res.message).toBe(TRAINING_STATE_MESSAGES.converged);
  });

  it('detects stuck state when loss is flat and accuracy is near 50%', () => {
    // E.g. Zero initialization or linear model on XOR
    const history = Array.from({ length: 12 }, (_, i) => ({
      epoch: 20 + i,
      loss: 0.693 + (i % 2) * 0.001,
      accuracy: 50,
    }));

    const res = detectTrainingStatus(history, true);
    expect(res.state).toBe('stuck');
    expect(res.message).toBe(TRAINING_STATE_MESSAGES.stuck);
  });

  it('detects unstable state when loss explodes or oscillates wildly', () => {
    // High learning rate causing loss explosion
    const exploding = [
      { epoch: 10, loss: 0.5, accuracy: 70 },
      { epoch: 11, loss: 1.2, accuracy: 60 },
      { epoch: 12, loss: 2.8, accuracy: 50 },
      { epoch: 13, loss: 4.5, accuracy: 45 },
      { epoch: 14, loss: 7.9, accuracy: 40 },
    ];

    const resExploding = detectTrainingStatus(exploding, true);
    expect(resExploding.state).toBe('unstable');
    expect(resExploding.message).toBe(TRAINING_STATE_MESSAGES.unstable);

    // High oscillation
    const oscillating = [
      { epoch: 10, loss: 0.4, accuracy: 65 },
      { epoch: 11, loss: 0.9, accuracy: 55 },
      { epoch: 12, loss: 0.35, accuracy: 70 },
      { epoch: 13, loss: 1.1, accuracy: 50 },
      { epoch: 14, loss: 0.3, accuracy: 72 },
      { epoch: 15, loss: 1.2, accuracy: 48 },
      { epoch: 16, loss: 0.28, accuracy: 74 },
    ];

    const resOscillating = detectTrainingStatus(oscillating, true);
    expect(resOscillating.state).toBe('unstable');
  });
});
