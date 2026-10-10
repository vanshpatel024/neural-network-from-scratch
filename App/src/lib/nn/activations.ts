import type { ActivationType } from './types';

export function activate(z: number, type: ActivationType): number {
  switch (type) {
    case 'relu':
      return z > 0 ? z : 0;
    case 'sigmoid': {
      const clamped = Math.max(-30, Math.min(30, z));
      return 1 / (1 + Math.exp(-clamped));
    }
    case 'tanh': {
      const clamped = Math.max(-20, Math.min(20, z));
      return Math.tanh(clamped);
    }
    case 'linear':
      return z;
  }
}

/**
 * Computes the derivative f'(z) given pre-activation z (and optionally cached activation a).
 */
export function activateDerivative(z: number, type: ActivationType, a?: number): number {
  switch (type) {
    case 'relu':
      return z > 0 ? 1 : 0;
    case 'sigmoid': {
      const val = a !== undefined ? a : activate(z, 'sigmoid');
      return val * (1 - val);
    }
    case 'tanh': {
      const val = a !== undefined ? a : activate(z, 'tanh');
      return 1 - val * val;
    }
    case 'linear':
      return 1;
  }
}
