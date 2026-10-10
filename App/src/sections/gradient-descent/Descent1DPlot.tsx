import { useEffect, useRef, useState } from 'react';
import {
  Mafs,
  Coordinates,
  Plot,
  Line,
  MovablePoint,
  Point,
  Polyline,
} from 'mafs';
import type { Function1D } from '@/lib/optim';

export interface DescentPoint {
  step: number;
  x: number;
  loss: number;
  grad: number;
}

export interface Descent1DPlotProps {
  fn: Function1D;
  currentX: number;
  history: readonly DescentPoint[];
  onDragX: (newX: number) => void;
  isDragging?: boolean;
}

export function Descent1DPlot({
  fn,
  currentX,
  history,
  onDragX,
}: Descent1DPlotProps): JSX.Element {
  // Smooth interpolated animated motion between discrete steps
  const [animatedX, setAnimatedX] = useState<number>(currentX);
  const animFrameRef = useRef<number | null>(null);
  const prevXRef = useRef<number>(currentX);

  useEffect(() => {
    const startX = prevXRef.current;
    const targetX = currentX;
    prevXRef.current = currentX;
    const startTime = performance.now();
    const duration = 160; // Smooth 160ms transition

    if (Math.abs(targetX - startX) < 1e-4) {
      setAnimatedX(targetX);
      return;
    }

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = startX + (targetX - startX) * ease;
      setAnimatedX(nextVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentX]);

  // Displayed point properties
  const displayX = Number.isFinite(animatedX) ? animatedX : currentX;
  const clampedX = Math.max(fn.xRange[0], Math.min(fn.xRange[1], displayX));
  const displayY = fn.f(clampedX);
  const displayGrad = fn.df(clampedX);

  const trailPoints: [number, number][] = history
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.loss))
    .map((p) => [p.x, p.loss]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <Mafs
        width="auto"
        height={340}
        viewBox={{ x: fn.xRange, y: fn.yRange }}
        pan={false}
        zoom={false}
      >
        <Coordinates.Cartesian
          subdivisions={2}
          xAxis={{ lines: 1, labels: (x) => `${x}` }}
          yAxis={{ lines: 2, labels: (y) => `${y}` }}
        />

        {/* Function Curve */}
        <Plot.OfX
          y={fn.f}
          color="var(--color-accent)"
          weight={3}
        />

        {/* History Trail Connecting Line */}
        {trailPoints.length > 1 && (
          <Polyline
            points={trailPoints}
            color="#60a5fa"
            weight={1.5}
            svgPolylineProps={{ strokeDasharray: '4 4' }}
          />
        )}

        {/* Previous Step Dots */}
        {history.map((pt, idx) => {
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.loss)) return null;
          const isLatest = idx === history.length - 1;
          if (isLatest) return null;
          return (
            <Point
              key={idx}
              x={pt.x}
              y={pt.loss}
              color="#3b82f6"
              opacity={0.4}
              svgCircleProps={{ r: 3 }}
            />
          );
        })}

        {/* Tangent Line Indicating Slope */}
        {Number.isFinite(displayGrad) && (
          <Line.PointSlope
            point={[clampedX, displayY]}
            slope={displayGrad}
            color="#f59e0b"
            weight={2}
            style="dashed"
          />
        )}

        {/* Draggable Current Point */}
        <MovablePoint
          point={[clampedX, displayY]}
          onMove={([newX]) => {
            const bounded = Math.max(fn.xRange[0], Math.min(fn.xRange[1], newX));
            onDragX(bounded);
          }}
          constrain={([x]) => {
            const bounded = Math.max(fn.xRange[0], Math.min(fn.xRange[1], x));
            return [bounded, fn.f(bounded)];
          }}
          color="#60a5fa"
        />
      </Mafs>

      {/* Visual Overlay Legend */}
      <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1.5 rounded-md border border-border-subtle bg-surface/80 p-2 text-caption backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-text-muted">Function curve</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-[#f59e0b]" />
          <span className="text-text-muted">Slope tangent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-light" />
          <span className="text-text-muted">Drag to start</span>
        </div>
      </div>
    </div>
  );
}
