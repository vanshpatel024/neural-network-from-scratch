export type Matrix = number[][];
export type Vector = number[];

export function sigmoid(x: number): number {
  if (x > 40) return 1;
  if (x < -40) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function sigmoidDerivative(x: number): number {
  const s = sigmoid(x);
  return s * (1 - s);
}

export function relu(x: number): number {
  return Math.max(0, x);
}

export function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

export function clip(
  val: number,
  minVal: number = 1e-15,
  maxVal: number = 1 - 1e-15
): number {
  return Math.max(minVal, Math.min(maxVal, val));
}

export function binaryCrossEntropy(yTrue: number, yPred: number): number {
  const p = clip(yPred);
  return -(yTrue * Math.log(p) + (1 - yTrue) * Math.log(1 - p));
}

export function transpose(matrix: Matrix): Matrix {
  if (matrix.length === 0 || matrix[0] === undefined) {
    return [];
  }
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Matrix = Array.from({ length: cols }, () =>
    new Array<number>(rows).fill(0)
  );

  for (let r = 0; r < rows; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < cols; c++) {
      const targetRow = result[c];
      if (targetRow) {
        targetRow[r] = row[c] ?? 0;
      }
    }
  }
  return result;
}

export function matmul(a: Matrix, b: Matrix): Matrix {
  const aRows = a.length;
  const aCols = a[0]?.length ?? 0;
  const bRows = b.length;
  const bCols = b[0]?.length ?? 0;

  if (aCols !== bRows) {
    throw new Error(
      `Dimension mismatch: A(${aRows}x${aCols}) cannot multiply B(${bRows}x${bCols})`
    );
  }

  const result: Matrix = Array.from({ length: aRows }, () =>
    new Array<number>(bCols).fill(0)
  );

  for (let i = 0; i < aRows; i++) {
    const aRow = a[i];
    const resRow = result[i];
    if (!aRow || !resRow) continue;
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += (aRow[k] ?? 0) * (b[k]?.[j] ?? 0);
      }
      resRow[j] = sum;
    }
  }

  return result;
}
