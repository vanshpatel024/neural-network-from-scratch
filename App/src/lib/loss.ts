import { sigmoid } from './activations';

/**
 * Binary Cross-Entropy (BCE) and Mean Squared Error (MSE) loss helpers.
 */

export function bce(p: number, y: number, eps = 1e-15): number {
  const pClamped = Math.max(eps, Math.min(1 - eps, p));
  return -(y * Math.log(pClamped) + (1 - y) * Math.log(1 - pClamped));
}

export function bceBatch(pList: readonly number[], yList: readonly number[], eps = 1e-15): number {
  if (pList.length === 0) return 0;
  const sum = pList.reduce((acc, p, i) => acc + bce(p, yList[i] ?? 0, eps), 0);
  return sum / pList.length;
}

export function dBce(p: number, y: number, eps = 1e-15): number {
  const pClamped = Math.max(eps, Math.min(1 - eps, p));
  return (pClamped - y) / (pClamped * (1 - pClamped));
}

export function mse(p: number, y: number): number {
  return (p - y) ** 2;
}

export function mseBatch(pList: readonly number[], yList: readonly number[]): number {
  if (pList.length === 0) return 0;
  const sum = pList.reduce((acc, p, i) => acc + mse(p, yList[i] ?? 0), 0);
  return sum / pList.length;
}

export function dMse(p: number, y: number): number {
  return 2 * (p - y);
}

export interface Point1D {
  id: number;
  x: number;
  y: number; // 0 or 1
}

export const DEFAULT_POINTS_1D: readonly Point1D[] = [
  { id: 1, x: -2.5, y: 0 },
  { id: 2, x: -1.2, y: 0 },
  { id: 3, x: -0.3, y: 0 },
  { id: 4, x: 0.4, y: 1 },
  { id: 5, x: 1.4, y: 1 },
  { id: 6, x: 2.6, y: 1 },
];

export interface Point1DLossResult {
  point: Point1D;
  z: number;
  p: number;
  loss: number;
}

export function computePointsLoss(
  points: readonly Point1D[],
  w: number,
  b: number
): {
  results: Point1DLossResult[];
  totalLoss: number;
} {
  const results = points.map((pt) => {
    const z = w * pt.x + b;
    const p = sigmoid(z);
    const loss = bce(p, pt.y);
    return {
      point: pt,
      z,
      p,
      loss,
    };
  });

  const totalLoss =
    results.length > 0
      ? results.reduce((acc, r) => acc + r.loss, 0) / results.length
      : 0;

  return { results, totalLoss };
}
