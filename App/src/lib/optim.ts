export interface Function1D {
  id: string;
  name: string;
  latex: string;
  f: (x: number) => number;
  df: (x: number) => number;
  defaultX: number;
  xRange: [number, number];
  yRange: [number, number];
  description: string;
}

export const CONVEX_1D: Function1D = {
  id: 'convex',
  name: 'Convex Bowl',
  latex: 'f(w) = w^2',
  f: (x: number) => x * x,
  df: (x: number) => 2 * x,
  defaultX: 2.5,
  xRange: [-3.2, 3.2],
  yRange: [-0.5, 8.5],
  description: 'A smooth bowl with one single global minimum at w = 0.',
};

export const NON_CONVEX_1D: Function1D = {
  id: 'non-convex',
  name: 'Two Wells and Saddle',
  latex: 'f(w) = 0.25w^4 - w^2 + 0.1w + 1.5',
  f: (x: number) => 0.25 * Math.pow(x, 4) - x * x + 0.1 * x + 1.5,
  df: (x: number) => Math.pow(x, 3) - 2 * x + 0.1,
  defaultX: -1.8,
  xRange: [-2.6, 2.6],
  yRange: [-0.5, 4.2],
  description: 'Two valleys separated by a flat saddle peak near w = 0.',
};

export interface Function2D {
  id: string;
  name: string;
  latex: string;
  f: (x: number, y: number) => number;
  grad: (x: number, y: number) => [number, number];
  defaultPoint: [number, number];
  xRange: [number, number];
  yRange: [number, number];
  contourLevels: number[];
  description: string;
}

export const ELONGATED_BOWL_2D: Function2D = {
  id: 'elongated-bowl',
  name: 'Elongated Ravine',
  latex: 'f(w_1, w_2) = w_1^2 + 10w_2^2',
  f: (x: number, y: number) => x * x + 10 * y * y,
  grad: (x: number, y: number) => [2 * x, 20 * y],
  defaultPoint: [-2.4, 1.2],
  xRange: [-3, 3],
  yRange: [-1.8, 1.8],
  contourLevels: [0.5, 1.5, 3.5, 6.5, 10.5, 16, 23],
  description: 'A narrow valley that curves 10 times steeper along w_2 than w_1.',
};

export const NON_CONVEX_2D: Function2D = {
  id: 'non-convex-2d',
  name: 'Two Basins & Saddle',
  latex: 'f(w_1, w_2) = 0.5(w_1^4 - 2w_1^2) + w_2^2 + 1',
  f: (x: number, y: number) => 0.5 * (Math.pow(x, 4) - 2 * x * x) + y * y + 1,
  grad: (x: number, y: number) => [2 * Math.pow(x, 3) - 2 * x, 2 * y],
  defaultPoint: [-1.7, 1.1],
  xRange: [-2.5, 2.5],
  yRange: [-1.8, 1.8],
  contourLevels: [0.6, 0.9, 1.3, 1.8, 2.5, 3.5],
  description: 'Two separate basins with a saddle pass connecting them at the origin.',
};

export interface Step1DResult {
  x: number;
  loss: number;
  grad: number;
  diverged: boolean;
}

export function step1D(
  x: number,
  learningRate: number,
  fn: Function1D,
  divergenceBound = 40
): Step1DResult {
  const grad = fn.df(x);
  const nextX = x - learningRate * grad;

  const isNanOrInf = !Number.isFinite(nextX);
  const isOutOfBound = Math.abs(nextX) > divergenceBound;

  if (isNanOrInf || isOutOfBound) {
    return {
      x: Math.sign(nextX) * divergenceBound,
      loss: Number.POSITIVE_INFINITY,
      grad,
      diverged: true,
    };
  }

  return {
    x: nextX,
    loss: fn.f(nextX),
    grad: fn.df(nextX),
    diverged: false,
  };
}

export function detectOscillation1D(history: { grad: number }[]): boolean {
  if (history.length < 3) return false;
  const g1 = history[history.length - 3]?.grad ?? 0;
  const g2 = history[history.length - 2]?.grad ?? 0;
  const g3 = history[history.length - 1]?.grad ?? 0;
  return g1 * g2 < 0 && g2 * g3 < 0 && Math.abs(g3) >= Math.abs(g2) * 0.7;
}

export interface Step2DResult {
  point: [number, number];
  velocity: [number, number];
  loss: number;
  grad: [number, number];
  diverged: boolean;
}

export function step2D(
  point: [number, number],
  learningRate: number,
  fn: Function2D,
  options?: {
    useMomentum?: boolean;
    momentumBeta?: number;
    velocity?: [number, number];
    divergenceBound?: number;
  }
): Step2DResult {
  const [x, y] = point;
  const [gx, gy] = fn.grad(x, y);

  const useMomentum = options?.useMomentum ?? false;
  const beta = options?.momentumBeta ?? 0.85;
  const [vx, vy] = options?.velocity ?? [0, 0];
  const bound = options?.divergenceBound ?? 25;

  let nextX: number;
  let nextY: number;
  let nextVx = 0;
  let nextVy = 0;

  if (useMomentum) {
    nextVx = beta * vx + learningRate * gx;
    nextVy = beta * vy + learningRate * gy;
    nextX = x - nextVx;
    nextY = y - nextVy;
  } else {
    nextX = x - learningRate * gx;
    nextY = y - learningRate * gy;
  }

  const isDiverged =
    !Number.isFinite(nextX) ||
    !Number.isFinite(nextY) ||
    Math.abs(nextX) > bound ||
    Math.abs(nextY) > bound;

  if (isDiverged) {
    return {
      point: [
        Math.sign(nextX || 1) * bound,
        Math.sign(nextY || 1) * bound,
      ],
      velocity: [0, 0],
      loss: Number.POSITIVE_INFINITY,
      grad: [gx, gy],
      diverged: true,
    };
  }

  return {
    point: [nextX, nextY],
    velocity: [nextVx, nextVy],
    loss: fn.f(nextX, nextY),
    grad: fn.grad(nextX, nextY),
    diverged: false,
  };
}

export function centeredDifference1D(
  f: (x: number) => number,
  x: number,
  eps = 1e-5
): number {
  return (f(x + eps) - f(x - eps)) / (2 * eps);
}

export function centeredDifference2D(
  f: (x: number, y: number) => number,
  x: number,
  y: number,
  eps = 1e-5
): [number, number] {
  const gx = (f(x + eps, y) - f(x - eps, y)) / (2 * eps);
  const gy = (f(x, y + eps) - f(x, y - eps)) / (2 * eps);
  return [gx, gy];
}
