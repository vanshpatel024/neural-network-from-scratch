/**
 * Pure math activation functions and their analytical derivatives.
 */

export function sigmoid(z: number): number {
  if (z >= 0) {
    const expNeg = Math.exp(-z);
    return 1 / (1 + expNeg);
  }
  // Numerically stable formulation for negative inputs to prevent overflow
  const expPos = Math.exp(z);
  return expPos / (1 + expPos);
}

export function dSigmoid(z: number): number {
  const s = sigmoid(z);
  return s * (1 - s);
}

export function tanh(z: number): number {
  return Math.tanh(z);
}

export function dTanh(z: number): number {
  const t = Math.tanh(z);
  return 1 - t * t;
}

export function relu(z: number): number {
  return Math.max(0, z);
}

export function dRelu(z: number): number {
  return z > 0 ? 1 : 0;
}

export function leakyRelu(z: number, alpha = 0.01): number {
  return z > 0 ? z : alpha * z;
}

export function dLeakyRelu(z: number, alpha = 0.01): number {
  return z > 0 ? 1 : alpha;
}

export interface ActivationInfo {
  id: 'sigmoid' | 'tanh' | 'relu' | 'leaky-relu';
  name: string;
  latex: string;
  dLatex: string;
  fn: (z: number) => number;
  dfn: (z: number) => number;
  range: string;
  maxDerivative: number;
  gradientRisk: string;
  description: string;
}

export const ACTIVATIONS: Record<'sigmoid' | 'tanh' | 'relu' | 'leaky-relu', ActivationInfo> = {
  sigmoid: {
    id: 'sigmoid',
    name: 'Sigmoid',
    latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
    dLatex: "\\sigma'(z) = \\sigma(z)(1 - \\sigma(z))",
    fn: sigmoid,
    dfn: dSigmoid,
    range: '(0, 1)',
    maxDerivative: 0.25,
    gradientRisk: 'High risk of vanishing gradients. Its slope is at most 0.25 and drops to zero fast.',
    description: 'Squashes numbers into values between 0 and 1. Use this for binary output probabilities.',
  },
  tanh: {
    id: 'tanh',
    name: 'Tanh',
    latex: '\\tanh(z) = \\frac{e^z - e^{-z}}{e^z + e^{-z}}',
    dLatex: "\\tanh'(z) = 1 - \\tanh^2(z)",
    fn: tanh,
    dfn: dTanh,
    range: '(-1, 1)',
    maxDerivative: 1.0,
    gradientRisk: 'Centered at zero with top slope 1.0. Large positive or negative inputs still flatten out.',
    description: 'Produces an S-curve from -1 to 1. It helps center data for the next layer.',
  },
  relu: {
    id: 'relu',
    name: 'ReLU',
    latex: '\\text{ReLU}(z) = \\max(0, z)',
    dLatex: "\\text{ReLU}'(z) = \\begin{cases} 1 & z > 0 \\\\ 0 & z \\le 0 \\end{cases}",
    fn: relu,
    dfn: dRelu,
    range: '[0, \\infty)',
    maxDerivative: 1.0,
    gradientRisk: 'The slope is 1 for positive inputs. Gradients do not shrink on positive values.',
    description: 'The standard choice for hidden layers. It is very fast and keeps gradients alive.',
  },
  'leaky-relu': {
    id: 'leaky-relu',
    name: 'Leaky ReLU',
    latex: '\\text{LeakyReLU}(z) = \\max(\\alpha z, z)',
    dLatex: "\\text{LeakyReLU}'(z) = \\begin{cases} 1 & z > 0 \\\\ 0.01 & z \\le 0 \\end{cases}",
    fn: (z: number) => leakyRelu(z, 0.05),
    dfn: (z: number) => dLeakyRelu(z, 0.05),
    range: '(-\\infty, \\infty)',
    maxDerivative: 1.0,
    gradientRisk: 'Keeps a small slope of 0.05 for negative inputs. Gradients never drop to zero.',
    description: 'Keeps a slight slope for negative inputs so dead neurons never get stuck.',
  },
};
