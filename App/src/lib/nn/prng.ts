/**
 * Seeded Pseudo-Random Number Generator (Mulberry32).
 * Provides deterministic, reproducible random sequences for datasets and weights.
 */
export class PRNG {
  private s: number;

  constructor(seed = 42) {
    this.s = (seed >>> 0) || 1;
  }

  /**
   * Resets the PRNG with a new seed.
   */
  seed(seed: number): void {
    this.s = (seed >>> 0) || 1;
  }

  /**
   * Returns a float in [0, 1).
   */
  random(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a float in [min, max).
   */
  range(min: number, max: number): number {
    return min + (max - min) * this.random();
  }

  /**
   * Standard normal distribution sample via Box-Muller transform.
   */
  gaussian(mean = 0, std = 1): number {
    let u1 = this.random();
    const u2 = this.random();
    while (u1 <= 1e-15) {
      u1 = this.random();
    }
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  }

  /**
   * In-place Fisher-Yates array shuffle.
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const temp = array[i]!;
      array[i] = array[j]!;
      array[j] = temp;
    }
    return array;
  }
}
