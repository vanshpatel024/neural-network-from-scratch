import type { DatasetResult, DatasetType, Point2D } from './types';
import { PRNG } from './prng';

export function generateDataset(
  type: DatasetType,
  count = 200,
  noise = 0.1,
  seed = 42
): DatasetResult {
  const prng = new PRNG(seed);
  const points: Point2D[] = [];

  const half = Math.floor(count / 2);

  switch (type) {
    case 'moons': {
      // Moon 0 (upper)
      for (let i = 0; i < half; i++) {
        const theta = (i / half) * Math.PI;
        const x = Math.cos(theta) - 0.5 + prng.gaussian(0, noise * 0.5);
        const y = Math.sin(theta) - 0.25 + prng.gaussian(0, noise * 0.5);
        points.push({ x: x * 1.3, y: y * 1.3, label: 0 });
      }
      // Moon 1 (lower)
      for (let i = 0; i < count - half; i++) {
        const theta = (i / (count - half)) * Math.PI;
        const x = 1 - Math.cos(theta) - 0.5 + prng.gaussian(0, noise * 0.5);
        const y = 1 - Math.sin(theta) - 0.75 + prng.gaussian(0, noise * 0.5);
        points.push({ x: x * 1.3, y: y * 1.3, label: 1 });
      }
      break;
    }

    case 'circles': {
      // Inner circle (label 0)
      for (let i = 0; i < half; i++) {
        const theta = prng.range(0, 2 * Math.PI);
        const r = 0.5 + prng.gaussian(0, noise * 0.35);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push({ x, y, label: 0 });
      }
      // Outer circle (label 1)
      for (let i = 0; i < count - half; i++) {
        const theta = prng.range(0, 2 * Math.PI);
        const r = 1.3 + prng.gaussian(0, noise * 0.35);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push({ x, y, label: 1 });
      }
      break;
    }

    case 'xor': {
      const qSize = Math.floor(count / 4);
      const std = 0.15 + noise * 0.35;
      const centers: Array<{ cx: number; cy: number; label: 0 | 1 }> = [
        { cx: 0.8, cy: 0.8, label: 0 },
        { cx: -0.8, cy: -0.8, label: 0 },
        { cx: -0.8, cy: 0.8, label: 1 },
        { cx: 0.8, cy: -0.8, label: 1 },
      ];

      for (let q = 0; q < 4; q++) {
        const { cx, cy, label } = centers[q]!;
        const nPoints = q === 3 ? count - 3 * qSize : qSize;
        for (let i = 0; i < nPoints; i++) {
          const x = cx + prng.gaussian(0, std);
          const y = cy + prng.gaussian(0, std);
          points.push({ x, y, label });
        }
      }
      break;
    }

    case 'blobs': {
      const std = 0.2 + noise * 0.3;
      // Blob 0 (bottom-left)
      for (let i = 0; i < half; i++) {
        const x = -0.8 + prng.gaussian(0, std);
        const y = -0.8 + prng.gaussian(0, std);
        points.push({ x, y, label: 0 });
      }
      // Blob 1 (top-right)
      for (let i = 0; i < count - half; i++) {
        const x = 0.8 + prng.gaussian(0, std);
        const y = 0.8 + prng.gaussian(0, std);
        points.push({ x, y, label: 1 });
      }
      break;
    }

    case 'spiral': {
      const maxTheta = 3.5 * Math.PI;
      const std = noise * 0.35;
      // Spiral 0
      for (let i = 0; i < half; i++) {
        const theta = (i / half) * maxTheta + 0.3;
        const r = (theta / maxTheta) * 1.4;
        const x = r * Math.cos(theta) + prng.gaussian(0, std);
        const y = r * Math.sin(theta) + prng.gaussian(0, std);
        points.push({ x, y, label: 0 });
      }
      // Spiral 1 (rotated by pi)
      for (let i = 0; i < count - half; i++) {
        const theta = (i / (count - half)) * maxTheta + 0.3;
        const r = (theta / maxTheta) * 1.4;
        const x = r * Math.cos(theta + Math.PI) + prng.gaussian(0, std);
        const y = r * Math.sin(theta + Math.PI) + prng.gaussian(0, std);
        points.push({ x, y, label: 1 });
      }
      break;
    }
  }

  // Shuffle points deterministically
  prng.shuffle(points);

  const X: number[][] = points.map((p) => [p.x, p.y]);
  const y: number[][] = points.map((p) => [p.label]);

  return { points, X, y };
}
