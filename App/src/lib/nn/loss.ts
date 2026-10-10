export function bceLoss(yPred: number[][], yTrue: number[][]): number {
  const N = yPred.length;
  if (N === 0) return 0;

  const eps = 1e-15;
  let totalLoss = 0;

  for (let i = 0; i < N; i++) {
    const p = Math.max(eps, Math.min(1 - eps, yPred[i]![0]!));
    const y = yTrue[i]![0]!;
    totalLoss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }

  return totalLoss / N;
}

export function binaryAccuracy(yPred: number[][], yTrue: number[][]): number {
  const N = yPred.length;
  if (N === 0) return 0;

  let correct = 0;
  for (let i = 0; i < N; i++) {
    const p = yPred[i]![0]!;
    const y = yTrue[i]![0]!;
    const predClass = p >= 0.5 ? 1 : 0;
    if (predClass === y) {
      correct++;
    }
  }

  return (correct / N) * 100;
}
