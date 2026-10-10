import { sigmoid } from './activations';

export interface NeuronState2D {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  b: number;
  z: number;
  a: number;
}

export function computeNeuron2D(
  x1: number,
  x2: number,
  w1: number,
  w2: number,
  b: number
): NeuronState2D {
  const z = w1 * x1 + w2 * x2 + b;
  const a = sigmoid(z);
  return {
    x1,
    x2,
    w1,
    w2,
    b,
    z,
    a,
  };
}

export interface DecisionBoundaryLine {
  isVertical: boolean;
  xIntercept?: number;
  slope?: number;
  yIntercept?: number;
  // Boundary segment clipped to box [xMin, xMax] x [yMin, yMax]
  p1: [number, number];
  p2: [number, number];
}

/**
 * Calculates the 2D decision boundary line w1*x1 + w2*x2 + b = 0
 * clipped to a given viewing rectangle.
 */
export function calculateDecisionBoundary(
  w1: number,
  w2: number,
  b: number,
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number } = {
    xMin: -3,
    xMax: 3,
    yMin: -3,
    yMax: 3,
  }
): DecisionBoundaryLine {
  const eps = 1e-6;
  const { xMin, xMax, yMin, yMax } = bounds;

  // Case 1: w2 is nearly zero -> vertical line w1*x1 + b = 0 => x1 = -b / w1
  if (Math.abs(w2) < eps) {
    if (Math.abs(w1) < eps) {
      // Degenerate case (both weights 0): dummy horizontal line outside view
      return {
        isVertical: false,
        slope: 0,
        yIntercept: 999,
        p1: [xMin, 999],
        p2: [xMax, 999],
      };
    }
    const xLine = -b / w1;
    return {
      isVertical: true,
      xIntercept: xLine,
      p1: [xLine, yMin],
      p2: [xLine, yMax],
    };
  }

  // Case 2: Standard non-vertical line x2 = (-w1/w2)*x1 - (b/w2)
  const slope = -w1 / w2;
  const yIntercept = -b / w2;

  // Find intersections with all four bounding edges
  const intersections: [number, number][] = [];

  // Left boundary: x = xMin
  const yAtXMin = slope * xMin + yIntercept;
  if (yAtXMin >= yMin - eps && yAtXMin <= yMax + eps) {
    intersections.push([xMin, Math.max(yMin, Math.min(yMax, yAtXMin))]);
  }

  // Right boundary: x = xMax
  const yAtXMax = slope * xMax + yIntercept;
  if (yAtXMax >= yMin - eps && yAtXMax <= yMax + eps) {
    intersections.push([xMax, Math.max(yMin, Math.min(yMax, yAtXMax))]);
  }

  // Bottom boundary: y = yMin
  if (Math.abs(slope) > eps) {
    const xAtYMin = (yMin - yIntercept) / slope;
    if (xAtYMin >= xMin - eps && xAtYMin <= xMax + eps) {
      intersections.push([Math.max(xMin, Math.min(xMax, xAtYMin)), yMin]);
    }
  }

  // Top boundary: y = yMax
  if (Math.abs(slope) > eps) {
    const xAtYMax = (yMax - yIntercept) / slope;
    if (xAtYMax >= xMin - eps && xAtYMax <= xMax + eps) {
      intersections.push([Math.max(xMin, Math.min(xMax, xAtYMax)), yMax]);
    }
  }

  // Deduplicate points close to corners
  const uniquePoints: [number, number][] = [];
  for (const pt of intersections) {
    if (!uniquePoints.some(([ux, uy]) => Math.hypot(ux - pt[0], uy - pt[1]) < 0.05)) {
      uniquePoints.push(pt);
    }
  }

  const p1 = uniquePoints[0] ?? [xMin, slope * xMin + yIntercept];
  const p2 = uniquePoints[1] ?? [xMax, slope * xMax + yIntercept];

  return {
    isVertical: false,
    slope,
    yIntercept,
    p1,
    p2,
  };
}
