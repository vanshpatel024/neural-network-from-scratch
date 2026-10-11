import type { BoundingBox } from './types';

/**
 * Pure function to compute the bounding box of pixels containing ink.
 * Works on raw RGBA pixel arrays without needing a DOM environment.
 *
 * @param data - Flat RGBA pixel buffer.
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @param threshold - Red channel threshold for detecting ink (default 20).
 */
export function findBoundingBox(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  threshold = 20
): BoundingBox {
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let hasInk = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if ((data[idx] ?? 0) > threshold) {
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasInk) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, hasInk: false };
  }

  return { minX, maxX, minY, maxY, hasInk: true };
}

export interface ExtractedFeatures {
  features: Float32Array;
  hasInk: boolean;
  offscreenCanvas: HTMLCanvasElement;
}

/**
 * Extracts 20x20 grayscale feature vector from a 280x280 canvas.
 * Exactly ports preprocessing from reference app.js.
 *
 * @param sourceCanvas - The 280x280 drawing canvas.
 * @param autoCenter - Whether smart bounding box centering is enabled.
 * @param existingOffscreen - Optional reusable 20x20 offscreen canvas.
 */
export function extract20x20Features(
  sourceCanvas: HTMLCanvasElement,
  autoCenter: boolean,
  existingOffscreen?: HTMLCanvasElement
): ExtractedFeatures {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not get 2D context from source canvas.');
  }

  const imgData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const bbox = findBoundingBox(
    imgData.data,
    sourceCanvas.width,
    sourceCanvas.height,
    20
  );

  const offscreen = existingOffscreen ?? document.createElement('canvas');
  if (offscreen.width !== 20 || offscreen.height !== 20) {
    offscreen.width = 20;
    offscreen.height = 20;
  }

  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!offCtx) {
    throw new Error('Could not get 2D context from offscreen canvas.');
  }

  // Clear offscreen background to solid black
  offCtx.fillStyle = '#000000';
  offCtx.fillRect(0, 0, 20, 20);

  if (!bbox.hasInk) {
    return {
      features: new Float32Array(400),
      hasInk: false,
      offscreenCanvas: offscreen,
    };
  }

  if (autoCenter) {
    // Smart Bounding Box Centering (matches MNIST / 01dataset style)
    // Scale box so its longer side is 14px, centered in 20x20 canvas
    const boxW = Math.max(1, bbox.maxX - bbox.minX + 1);
    const boxH = Math.max(1, bbox.maxY - bbox.minY + 1);
    const targetSize = 14;

    const scale = targetSize / Math.max(boxW, boxH);
    const renderW = boxW * scale;
    const renderH = boxH * scale;

    const offsetX = (20 - renderW) / 2;
    const offsetY = (20 - renderH) / 2;

    offCtx.drawImage(
      sourceCanvas,
      bbox.minX,
      bbox.minY,
      boxW,
      boxH,
      offsetX,
      offsetY,
      renderW,
      renderH
    );
  } else {
    // Direct resampling
    offCtx.drawImage(sourceCanvas, 0, 0, 20, 20);
  }

  const offscreenData = offCtx.getImageData(0, 0, 20, 20).data;
  const features = new Float32Array(400);

  for (let i = 0; i < 400; i++) {
    // Red channel normalized to [0, 1]
    features[i] = (offscreenData[i * 4] ?? 0) / 255.0;
  }

  return {
    features,
    hasInk: true,
    offscreenCanvas: offscreen,
  };
}
