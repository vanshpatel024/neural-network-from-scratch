import { useRef, useEffect, useCallback, useState } from 'react';
import type { DecisionBoundaryGrid, Point2D } from '../../lib/nn/types';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

interface DecisionBoundaryCanvasProps {
  grid: DecisionBoundaryGrid | null;
  points: Point2D[];
  datasetName: string;
  addPointsMode: 'off' | 'class0' | 'class1';
  onSetAddPointsMode: (mode: 'off' | 'class0' | 'class1') => void;
  onAddPoint: (point: Point2D) => void;
}

export function DecisionBoundaryCanvas({
  grid,
  points,
  datasetName,
  addPointsMode,
  onSetAddPointsMode,
  onAddPoint,
}: DecisionBoundaryCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const rafIdRef = useRef<number | null>(null);

  // Track visibility with IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? true);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Helper to convert world coordinate to canvas coordinate
  const worldToCanvas = useCallback(
    (wx: number, wy: number, width: number, height: number) => {
      const cx = ((wx + 2) / 4) * width;
      const cy = ((2 - wy) / 4) * height;
      return { cx, cy };
    },
    []
  );

  // Helper to convert canvas click to world coordinate
  const canvasToWorld = useCallback(
    (cx: number, cy: number, width: number, height: number) => {
      const wx = -2 + (cx / width) * 4;
      const wy = 2 - (cy / height) * 4;
      return { wx, wy };
    },
    []
  );

  // Render loop using requestAnimationFrame when visible and new data arrives
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw decision boundary heatmap if grid is available
    if (grid && grid.probabilities.length > 0) {
      const res = grid.resolution;
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      if (offscreen.width !== res || offscreen.height !== res) {
        offscreen.width = res;
        offscreen.height = res;
      }
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(res, res);
        const data = imgData.data;

        for (let row = 0; row < res; row++) {
          for (let col = 0; col < res; col++) {
            const idx = row * res + col;
            const p = grid.probabilities[idx] ?? 0.5;
            const pixelIdx = idx * 4;

            // Class 0 (p near 0): Soft Blue [30, 64, 175]
            // Decision boundary (p near 0.5): Deep Surface [18, 18, 21]
            // Class 1 (p near 1): Warm Orange [234, 88, 12]
            let r = 0;
            let g = 0;
            let b = 0;

            if (p < 0.5) {
              const t = p / 0.5;
              r = Math.round(30 * (1 - t) + 18 * t);
              g = Math.round(64 * (1 - t) + 18 * t);
              b = Math.round(175 * (1 - t) + 21 * t);
            } else {
              const t = (p - 0.5) / 0.5;
              r = Math.round(18 * (1 - t) + 234 * t);
              g = Math.round(18 * (1 - t) + 88 * t);
              b = Math.round(21 * (1 - t) + 12 * t);
            }

            data[pixelIdx] = r;
            data[pixelIdx + 1] = g;
            data[pixelIdx + 2] = b;
            data[pixelIdx + 3] = 235;
          }
        }
        offCtx.putImageData(imgData, 0, 0);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, width, height);
      }
    } else {
      ctx.fillStyle = '#121215';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw subtle coordinate axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const midY = height / 2;
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    const midX = width / 2;
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, height);
    ctx.stroke();

    // 3. Draw data points
    const res = grid?.resolution ?? 40;
    for (const pt of points) {
      const { cx, cy } = worldToCanvas(pt.x, pt.y, width, height);

      let isMisclassified = false;
      if (grid && grid.probabilities.length > 0) {
        const col = Math.max(
          0,
          Math.min(res - 1, Math.round(((pt.x + 2) / 4) * (res - 1)))
        );
        const row = Math.max(
          0,
          Math.min(res - 1, Math.round(((2 - pt.y) / 4) * (res - 1)))
        );
        const pVal = grid.probabilities[row * res + col] ?? 0.5;
        isMisclassified =
          (pt.label === 0 && pVal >= 0.5) || (pt.label === 1 && pVal < 0.5);
      }

      if (isMisclassified) {
        ctx.beginPath();
        ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = pt.label === 0 ? '#38bdf8' : '#fb923c';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }, [grid, points, isVisible, worldToCanvas]);

  useEffect(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(renderCanvas);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [renderCanvas]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(renderCanvas);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (addPointsMode === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { wx, wy } = canvasToWorld(clickX, clickY, rect.width, rect.height);
    const clampedX = Math.max(-1.9, Math.min(1.9, wx));
    const clampedY = Math.max(-1.9, Math.min(1.9, wy));

    const label = addPointsMode === 'class1' ? 1 : 0;
    onAddPoint({
      x: Math.round(clampedX * 100) / 100,
      y: Math.round(clampedY * 100) / 100,
      label,
    });
  };

  const isAddingPoints = addPointsMode !== 'off';

  return (
    <div ref={containerRef} className="flex flex-col gap-2.5 w-full">
      {/* Slim Toolbar Above Canvas */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Compact Legend on Left */}
        <div className="flex items-center gap-3 text-caption text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm" />
            <span>Class 0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block shadow-sm" />
            <span>Class 1</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="w-2.5 h-2.5 rounded-full border border-danger inline-block" />
            <span>Ring = wrong</span>
          </div>
        </div>

        {/* Add Points SegmentedControl on Right */}
        <div className="flex items-center gap-2">
          <span className="text-caption text-text-muted font-medium">Add:</span>
          <SegmentedControl<'off' | 'class0' | 'class1'>
            size="sm"
            options={[
              { value: 'off', label: 'Off' },
              { value: 'class0', label: 'Class 0' },
              { value: 'class1', label: 'Class 1' },
            ]}
            value={addPointsMode}
            onChange={onSetAddPointsMode}
          />
        </div>
      </div>

      {/* Hero Canvas Container */}
      <div className="relative w-full aspect-square max-h-[70dvh] rounded-xl overflow-hidden border border-border-subtle bg-surface shadow-md">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          aria-label={`Decision boundary map for ${datasetName} dataset with ${points.length} points`}
          style={{
            touchAction: isAddingPoints ? 'none' : 'pan-y',
            cursor: isAddingPoints ? 'crosshair' : 'default',
          }}
          className="w-full h-full block"
        />

        {/* Tap to add point hint banner when adding is enabled */}
        {isAddingPoints && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-surface/90 border border-border-subtle backdrop-blur-md px-3 py-1 rounded-full text-caption text-accent-light shadow-sm pointer-events-none">
            Tap the canvas to add a point
          </div>
        )}
      </div>
    </div>
  );
}
