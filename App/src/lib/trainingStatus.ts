export type TrainingStateType =
  | 'idle'
  | 'learning'
  | 'converged'
  | 'stuck'
  | 'unstable';

export interface TrainingStateInfo {
  state: TrainingStateType;
  message: string;
}

export const TRAINING_STATE_MESSAGES: Record<TrainingStateType, string> = {
  idle: 'Press Train to start.',
  learning: 'Loss is going down. The model is learning.',
  converged:
    'Loss stopped changing and accuracy is high. Training has settled.',
  stuck:
    'Loss is not changing and accuracy is near 50%. The weights may be stuck. Try a different initialization.',
  unstable:
    'Loss is jumping up and down or growing. The learning rate may be too high.',
};

export interface StatusHistoryPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

/**
 * Pure function to detect the qualitative training state of the model.
 * Evaluates a rolling window of recent epochs to determine if the model is:
 * - idle: Not yet trained
 * - learning: Loss trending down normally
 * - converged: Loss settled and accuracy is high (>=85%)
 * - stuck: Loss flat and accuracy hovering near 50%
 * - unstable: Loss blowing up or oscillating violently
 */
export function detectTrainingStatus(
  history: readonly StatusHistoryPoint[],
  isTraining: boolean,
  windowSize = 12
): TrainingStateInfo {
  if (history.length <= 1 && !isTraining) {
    return {
      state: 'idle',
      message: TRAINING_STATE_MESSAGES.idle,
    };
  }

  if (history.length < 5) {
    return {
      state: 'learning',
      message: TRAINING_STATE_MESSAGES.learning,
    };
  }

  const window = history.slice(-windowSize);
  const n = window.length;

  const losses = window.map((p) => p.loss);
  const accs = window.map((p) => p.accuracy);

  const firstLoss = losses[0]!;
  const lastLoss = losses[n - 1]!;
  const latestAcc = accs[n - 1]!;

  // 1. Check for instability (exploding loss or massive oscillation)
  let oscCount = 0;
  let totalDelta = 0;
  for (let i = 1; i < n; i++) {
    const diff = losses[i]! - losses[i - 1]!;
    totalDelta += Math.abs(diff);
    if (i >= 2) {
      const prevDiff = losses[i - 1]! - losses[i - 2]!;
      if (diff * prevDiff < 0 && Math.abs(diff) > 0.08) {
        oscCount++;
      }
    }
  }

  const isBlowingUp = lastLoss > 2.5 || (lastLoss > 1.8 * firstLoss && lastLoss > 0.8);
  const isOscillating = oscCount >= 3 && totalDelta / n > 0.12;

  if (isBlowingUp || isOscillating) {
    return {
      state: 'unstable',
      message: TRAINING_STATE_MESSAGES.unstable,
    };
  }

  // Calculate loss variance in the window
  const meanLoss = losses.reduce((a, b) => a + b, 0) / n;
  const varianceLoss =
    losses.reduce((sum, l) => sum + (l - meanLoss) ** 2, 0) / n;
  const stdLoss = Math.sqrt(varianceLoss);
  const lossSpan = Math.abs(lastLoss - firstLoss);

  // 2. Check for convergence: settled loss + high accuracy
  if (latestAcc >= 85 && (stdLoss < 0.015 || lossSpan < 0.02)) {
    return {
      state: 'converged',
      message: TRAINING_STATE_MESSAGES.converged,
    };
  }

  // 3. Check for stuck: settled loss + near 50% accuracy (e.g. zeros init or XOR with no hidden layer)
  const meanAcc = accs.reduce((a, b) => a + b, 0) / n;
  if (
    meanAcc >= 42 &&
    meanAcc <= 62 &&
    latestAcc <= 65 &&
    (stdLoss < 0.02 || lossSpan < 0.025)
  ) {
    return {
      state: 'stuck',
      message: TRAINING_STATE_MESSAGES.stuck,
    };
  }

  // Default healthy state
  return {
    state: 'learning',
    message: TRAINING_STATE_MESSAGES.learning,
  };
}
