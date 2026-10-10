import type { InitType } from './types';
import type { PRNG } from './prng';

export function initializeWeightsAndBiases(
  inputDim: number,
  outputDim: number,
  initType: InitType,
  prng: PRNG
): { weights: number[][]; biases: number[] } {
  const weights: number[][] = [];
  const biases: number[] = new Array(outputDim).fill(0);

  let std = 0;
  switch (initType) {
    case 'zeros':
      std = 0;
      break;
    case 'random':
      std = 0.1;
      break;
    case 'xavier':
      std = Math.sqrt(2 / (inputDim + outputDim));
      break;
    case 'he':
      std = Math.sqrt(2 / inputDim);
      break;
  }

  for (let i = 0; i < inputDim; i++) {
    const row: number[] = [];
    for (let j = 0; j < outputDim; j++) {
      if (initType === 'zeros') {
        row.push(0);
      } else {
        row.push(prng.gaussian(0, std));
      }
    }
    weights.push(row);
  }

  return { weights, biases };
}
