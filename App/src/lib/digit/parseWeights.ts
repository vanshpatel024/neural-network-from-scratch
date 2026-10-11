import type { LayerWeight, ParsedModel } from './types';

interface RawLayer {
  W: unknown;
  b: unknown;
}

/**
 * Parses and validates network weights from JSON.
 * Supports:
 * 1) Flat object: { W1, b1, W2, b2, W3, b3, ... }
 * 2) Nested object: { layers: [{ W, b }, ...] }
 * 3) Direct array: [{ W, b }, ...]
 */
export function parseWeights(json: unknown): ParsedModel {
  if (!json || typeof json !== 'object') {
    throw new Error('Weights data must be a valid JSON object or array.');
  }

  const rawLayers: RawLayer[] = [];

  if (Array.isArray(json)) {
    rawLayers.push(...(json as RawLayer[]));
  } else {
    const record = json as Record<string, unknown>;
    if (Array.isArray(record.layers)) {
      rawLayers.push(...(record.layers as RawLayer[]));
    } else if (record.W1 && record.b1) {
      let idx = 1;
      while (record[`W${idx}`] && record[`b${idx}`]) {
        rawLayers.push({
          W: record[`W${idx}`],
          b: record[`b${idx}`],
        });
        idx++;
      }
    }
  }

  if (rawLayers.length === 0) {
    throw new Error(
      'Could not find layers in weights file. Expected keys W1, b1 or a layers list.'
    );
  }

  const typedLayers: LayerWeight[] = [];

  for (let i = 0; i < rawLayers.length; i++) {
    const layer = rawLayers[i];
    if (!layer || typeof layer !== 'object') {
      throw new Error(`Layer ${i + 1} is invalid.`);
    }

    // Validate weights 2D matrix
    if (!Array.isArray(layer.W) || layer.W.length === 0 || !Array.isArray(layer.W[0])) {
      throw new Error(`Layer ${i + 1} weights must be a 2D matrix.`);
    }

    const W = layer.W as number[][];
    const nIn = W.length;
    const nOut = W[0]?.length ?? 0;

    if (nIn === 0 || nOut === 0) {
      throw new Error(`Layer ${i + 1} matrix dimensions must be greater than zero.`);
    }

    // Verify rectangular matrix shape
    for (let r = 0; r < nIn; r++) {
      const row = W[r];
      if (!row || !Array.isArray(row) || row.length !== nOut) {
        throw new Error(`Layer ${i + 1} weights matrix is not rectangular.`);
      }
    }

    // Normalize bias: could be 1D [b0, b1...] or 2D [[b0, b1...]]
    let biasArray: number[];
    if (Array.isArray(layer.b)) {
      if (layer.b.length > 0 && Array.isArray(layer.b[0])) {
        biasArray = (layer.b as number[][])[0] ?? [];
      } else {
        biasArray = layer.b as number[];
      }
    } else {
      throw new Error(`Layer ${i + 1} bias must be an array.`);
    }

    if (biasArray.length !== nOut) {
      throw new Error(
        `Layer ${i + 1} bias size (${biasArray.length}) does not match output size (${nOut}).`
      );
    }

    // Flatten weights into Float64Array (row-major: row i, col j => i * nOut + j)
    const flattenedW = new Float64Array(nIn * nOut);
    for (let r = 0; r < nIn; r++) {
      const row = W[r]!;
      for (let c = 0; c < nOut; c++) {
        flattenedW[r * nOut + c] = Number(row[c]);
      }
    }

    const flattenedB = new Float64Array(nOut);
    for (let c = 0; c < nOut; c++) {
      flattenedB[c] = Number(biasArray[c]);
    }

    const isLast = i === rawLayers.length - 1;
    typedLayers.push({
      nIn,
      nOut,
      weights: flattenedW,
      bias: flattenedB,
      activation: isLast ? 'sigmoid' : 'relu',
    });
  }

  // Validate network architecture invariants
  const firstLayer = typedLayers[0]!;
  if (firstLayer.nIn !== 400) {
    throw new Error(`First layer must have 400 inputs (got ${firstLayer.nIn}).`);
  }

  const lastLayer = typedLayers[typedLayers.length - 1]!;
  if (lastLayer.nOut !== 1) {
    throw new Error(`Last layer must have 1 output (got ${lastLayer.nOut}).`);
  }

  // Check shape consistency between consecutive layers
  for (let i = 1; i < typedLayers.length; i++) {
    const prev = typedLayers[i - 1]!;
    const curr = typedLayers[i]!;
    if (prev.nOut !== curr.nIn) {
      throw new Error(
        `Layer ${i + 1} expects ${curr.nIn} inputs, but layer ${i} outputs ${prev.nOut}.`
      );
    }
  }

  const archSummary = typedLayers
    .map((l, i) => (i === 0 ? `${l.nIn} → ${l.nOut}` : `→ ${l.nOut}`))
    .join(' ');

  return {
    layers: typedLayers,
    architectureSummary: archSummary,
  };
}
