import { relu, sigmoid } from './activations';

export type Matrix = number[][];

/**
 * Creates a matrix with specified dimensions and initial value.
 */
export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

/**
 * Multiplies matrix A (m x k) by matrix B (k x n).
 * Throws clear shape mismatch error if inner dimensions do not match.
 */
export function matmul(A: Matrix, B: Matrix): Matrix {
  if (A.length === 0 || B.length === 0) {
    throw new Error('Cannot multiply empty matrices.');
  }

  const rowsA = A.length;
  const colsA = A[0]?.length ?? 0;
  const rowsB = B.length;
  const colsB = B[0]?.length ?? 0;

  if (colsA !== rowsB) {
    throw new Error(
      `Matrix dimensions mismatch: A is (${rowsA}×${colsA}) but B is (${rowsB}×${colsB}). Inner dimensions must match (${colsA} !== ${rowsB}).`
    );
  }

  const C = createMatrix(rowsA, colsB, 0);

  for (let i = 0; i < rowsA; i++) {
    const rowA = A[i];
    if (!rowA) continue;
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        const valA = rowA[k] ?? 0;
        const valB = B[k]?.[j] ?? 0;
        sum += valA * valB;
      }
      C[i]![j] = sum;
    }
  }

  return C;
}

/**
 * Adds row vector bias b (1 x n or n elements) to each row of matrix Z (m x n).
 */
export function addBias(Z: Matrix, b: Matrix | number[]): Matrix {
  if (Z.length === 0) return [];
  const rows = Z.length;
  const cols = Z[0]?.length ?? 0;

  const biasRow: number[] = Array.isArray(b[0]) ? (b as Matrix)[0] ?? [] : (b as number[]);

  if (biasRow.length !== cols) {
    throw new Error(
      `Bias vector length (${biasRow.length}) does not match matrix columns (${cols}).`
    );
  }

  const result = createMatrix(rows, cols, 0);

  for (let i = 0; i < rows; i++) {
    const rowZ = Z[i];
    if (!rowZ) continue;
    for (let j = 0; j < cols; j++) {
      result[i]![j] = (rowZ[j] ?? 0) + (biasRow[j] ?? 0);
    }
  }

  return result;
}

/**
 * Applies a function element-wise to each value in matrix M.
 */
export function applyElementwise(M: Matrix, fn: (val: number) => number): Matrix {
  return M.map((row) => row.map((val) => fn(val)));
}

/**
 * Transposes a matrix.
 */
export function transpose(M: Matrix): Matrix {
  if (M.length === 0) return [];
  const rows = M.length;
  const cols = M[0]?.length ?? 0;
  const T = createMatrix(cols, rows, 0);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j]![i] = M[i]?.[j] ?? 0;
    }
  }

  return T;
}

// -------------------------------------------------------------
// Interactive 2-3-1 Forward Pass Simulation Engine
// -------------------------------------------------------------

export interface ForwardStepState {
  layerIndex: number;
  phase: 'input' | 'dense1-z' | 'dense1-a' | 'dense2-z' | 'dense2-a';
  title: string;
  mathFormula: string;
  substitutedFormula: string;
  X: Matrix; // 1 x 2
  W1: Matrix; // 2 x 3
  b1: Matrix; // 1 x 3
  Z1: Matrix; // 1 x 3
  A1: Matrix; // 1 x 3
  W2: Matrix; // 3 x 1
  b2: Matrix; // 1 x 1
  Z2: Matrix; // 1 x 1
  A2: Matrix; // 1 x 1 (prediction y_hat)
}

export const DEFAULT_WEIGHTS_231 = {
  W1: [
    [0.8, -0.5, 0.4],
    [-0.3, 0.9, -0.6],
  ],
  b1: [[0.1, -0.2, 0.3]],
  W2: [[1.2], [-0.8], [0.5]],
  b2: [[-0.1]],
};

export function computeForwardPass231(
  x1: number,
  x2: number,
  weights = DEFAULT_WEIGHTS_231
): {
  X: Matrix;
  Z1: Matrix;
  A1: Matrix;
  Z2: Matrix;
  A2: Matrix;
} {
  const X: Matrix = [[x1, x2]];
  const { W1, b1, W2, b2 } = weights;

  const Z1 = addBias(matmul(X, W1), b1);
  const A1 = applyElementwise(Z1, relu);

  const Z2 = addBias(matmul(A1, W2), b2);
  const A2 = applyElementwise(Z2, sigmoid);

  return { X, Z1, A1, Z2, A2 };
}

export interface BackwardPass231Result {
  X: Matrix;
  Z1: Matrix;
  A1: Matrix;
  Z2: Matrix;
  A2: Matrix;
  y: number;
  loss: number;
  dZ2: Matrix;
  dW2: Matrix;
  db2: Matrix;
  dA1: Matrix;
  dZ1: Matrix;
  dW1: Matrix;
  db1: Matrix;
}

export function computeBackwardPass231(
  x1: number,
  x2: number,
  y = 1.0,
  weights = DEFAULT_WEIGHTS_231
): BackwardPass231Result {
  const fwd = computeForwardPass231(x1, x2, weights);
  const { X, Z1, A1, Z2, A2 } = fwd;
  const { W2 } = weights;

  const yHat = A2[0]?.[0] ?? 0;
  const pClamped = Math.max(1e-15, Math.min(1 - 1e-15, yHat));
  const loss = -(y * Math.log(pClamped) + (1 - y) * Math.log(1 - pClamped));

  // 1. Output error signal: dZ2 = yHat - y
  const dZ2: Matrix = [[yHat - y]];

  // 2. Output layer parameter gradients: dW2 = (A1)^T * dZ2, db2 = dZ2
  const dW2 = matmul(transpose(A1), dZ2);
  const db2: Matrix = [[dZ2[0]?.[0] ?? 0]];

  // 3. Hidden layer backpropagation: dA1 = dZ2 * (W2)^T
  const dA1 = matmul(dZ2, transpose(W2));

  // dZ1 = dA1 * (Z1 > 0)
  const dZ1: Matrix = [
    (dA1[0] ?? []).map((gradVal, j) => ((Z1[0]?.[j] ?? 0) > 0 ? gradVal : 0)),
  ];

  // 4. Layer 1 parameter gradients: dW1 = X^T * dZ1, db1 = dZ1
  const dW1 = matmul(transpose(X), dZ1);
  const db1: Matrix = [[...(dZ1[0] ?? [])]];

  return {
    X,
    Z1,
    A1,
    Z2,
    A2,
    y,
    loss,
    dZ2,
    dW2,
    db2,
    dA1,
    dZ1,
    dW1,
    db1,
  };
}
