import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Stat } from '@/components/ui/Stat';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { Tooltip } from '@/components/ui/Tooltip';
import { ELONGATED_BOWL_2D, step2D, type Step2DResult } from '@/lib/optim';

export interface ContourPlot2DProps {
  className?: string;
}

export function ContourPlot2D({ className = '' }: ContourPlot2DProps): JSX.Element {
  const [learningRate, setLearningRate] = useState<number>(0.16);
  const [useMomentum, setUseMomentum] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(5); // steps per second

  // Current optimization state
  const initialPoint = ELONGATED_BOWL_2D.defaultPoint;
  const [currentPoint, setCurrentPoint] = useState<[number, number]>(initialPoint);
  const [history, setHistory] = useState<[number, number][]>([initialPoint]);
  const [isDiverged, setIsDiverged] = useState<boolean>(false);

  // Synchronous refs to prevent race conditions during rapid animation ticks
  const pointRef = useRef<[number, number]>(initialPoint);
  const velocityRef = useRef<[number, number]>([0, 0]);

  // SVG coordinate dimensions
  const svgWidth = 600;
  const svgHeight = 360;
  const xRange = ELONGATED_BOWL_2D.xRange; // [-3, 3]
  const yRange = ELONGATED_BOWL_2D.yRange; // [-1.8, 1.8]

  // Coordinate transforms
  const toSvgX = useCallback(
    (x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * svgWidth,
    [xRange]
  );
  const toSvgY = useCallback(
    (y: number) => svgHeight - ((y - yRange[0]) / (yRange[1] - yRange[0])) * svgHeight,
    [yRange]
  );
  const fromSvgX = useCallback(
    (svgX: number) => xRange[0] + (svgX / svgWidth) * (xRange[1] - xRange[0]),
    [xRange]
  );
  const fromSvgY = useCallback(
    (svgY: number) => yRange[0] + ((svgHeight - svgY) / svgHeight) * (yRange[1] - yRange[0]),
    [yRange]
  );

  // Single optimization step
  const executeStep = useCallback((): boolean => {
    if (isDiverged) return false;

    const res: Step2DResult = step2D(pointRef.current, learningRate, ELONGATED_BOWL_2D, {
      useMomentum,
      momentumBeta: 0.85,
      velocity: velocityRef.current,
    });

    if (res.diverged) {
      setIsDiverged(true);
      setIsPlaying(false);
      return false;
    }

    pointRef.current = res.point;
    velocityRef.current = res.velocity;
    setCurrentPoint(res.point);
    setHistory((h) => [...h, res.point]);
    return true;
  }, [learningRate, useMomentum, isDiverged]);

  // Tick loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(50, 1000 / speed);
    const interval = setInterval(() => {
      executeStep();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, executeStep]);

  // Reset helper
  const handleReset = (newPoint?: [number, number]): void => {
    setIsPlaying(false);
    setIsDiverged(false);
    const pt = newPoint ?? initialPoint;
    pointRef.current = pt;
    velocityRef.current = [0, 0];
    setCurrentPoint(pt);
    setHistory([pt]);
  };

  // Dragging support on SVG canvas
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>): void => {
    setIsDragging(true);
    setIsPlaying(false);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) * (svgWidth / rect.width);
    const clientY = (e.clientY - rect.top) * (svgHeight / rect.height);
    const w1 = Math.max(xRange[0], Math.min(xRange[1], fromSvgX(clientX)));
    const w2 = Math.max(yRange[0], Math.min(yRange[1], fromSvgY(clientY)));
    handleReset([parseFloat(w1.toFixed(2)), parseFloat(w2.toFixed(2))]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) * (svgWidth / rect.width);
    const clientY = (e.clientY - rect.top) * (svgHeight / rect.height);
    const w1 = Math.max(xRange[0], Math.min(xRange[1], fromSvgX(clientX)));
    const w2 = Math.max(yRange[0], Math.min(yRange[1], fromSvgY(clientY)));
    handleReset([parseFloat(w1.toFixed(2)), parseFloat(w2.toFixed(2))]);
  };

  const handlePointerUp = (): void => {
    setIsDragging(false);
  };

  // Presets
  const applyPreset = (preset: 'zigzag' | 'momentum' | 'balanced'): void => {
    if (preset === 'zigzag') {
      setLearningRate(0.18);
      setUseMomentum(false);
      handleReset([-2.4, 1.2]);
    } else if (preset === 'momentum') {
      setLearningRate(0.18);
      setUseMomentum(true);
      handleReset([-2.4, 1.2]);
    } else {
      setLearningRate(0.08);
      setUseMomentum(false);
      handleReset([-2.4, 1.2]);
    }
  };

  // Metrics
  const currentLoss = ELONGATED_BOWL_2D.f(currentPoint[0], currentPoint[1]);
  const [gx, gy] = ELONGATED_BOWL_2D.grad(currentPoint[0], currentPoint[1]);
  const gradNorm = Math.sqrt(gx * gx + gy * gy);

  // SVG path for trajectory
  const trajectoryD = useMemo(() => {
    if (history.length === 0) return '';
    return history
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt[0])} ${toSvgY(pt[1])}`)
      .join(' ');
  }, [history, toSvgX, toSvgY]);

  // Ellipse contour paths
  const contourEllipses = useMemo(() => {
    return ELONGATED_BOWL_2D.contourLevels.map((c) => {
      const rx = Math.sqrt(c);
      const ry = Math.sqrt(c / 10);
      const svgRx = (rx / (xRange[1] - xRange[0])) * svgWidth;
      const svgRy = (ry / (yRange[1] - yRange[0])) * svgHeight;
      return { c, svgRx, svgRy };
    });
  }, [xRange, yRange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Interactive SVG Contour Surface */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-auto max-h-[380px] cursor-crosshair select-none touch-none block"
        >
          {/* Subtle Grid Lines */}
          <line
            x1={0}
            y1={toSvgY(0)}
            x2={svgWidth}
            y2={toSvgY(0)}
            stroke="#27272a"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={toSvgX(0)}
            y1={0}
            x2={toSvgX(0)}
            y2={svgHeight}
            stroke="#27272a"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Concentric Contour Ellipses */}
          {contourEllipses.map(({ c, svgRx, svgRy }) => (
            <g key={c}>
              <ellipse
                cx={toSvgX(0)}
                cy={toSvgY(0)}
                rx={svgRx}
                ry={svgRy}
                fill="none"
                stroke="#3f3f46"
                strokeWidth="1"
                opacity={0.65}
              />
              {/* Level annotation text */}
              <text
                x={toSvgX(0) + svgRx - 14}
                y={toSvgY(0) - 4}
                fill="#71717a"
                fontSize="10"
                fontFamily="monospace"
              >
                {c}
              </text>
            </g>
          ))}

          {/* Minimum Marker at Origin */}
          <circle
            cx={toSvgX(0)}
            cy={toSvgY(0)}
            r={3}
            fill="#10b981"
          />
          <text
            x={toSvgX(0) + 6}
            y={toSvgY(0) + 12}
            fill="#10b981"
            fontSize="10"
            fontFamily="monospace"
          >
            Min (0, 0)
          </text>

          {/* Descent Trajectory Trail */}
          {trajectoryD && (
            <path
              d={trajectoryD}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Historical Step Dots */}
          {history.map((pt, i) => (
            <circle
              key={i}
              cx={toSvgX(pt[0])}
              cy={toSvgY(pt[1])}
              r={i === 0 ? 4 : 2.5}
              fill={i === 0 ? '#10b981' : '#3b82f6'}
              opacity={0.8}
            />
          ))}

          {/* Active Head Position Marker */}
          <circle
            cx={toSvgX(currentPoint[0])}
            cy={toSvgY(currentPoint[1])}
            r={6}
            fill="#60a5fa"
            stroke="#f4f4f5"
            strokeWidth="2"
          />
        </svg>

        {/* Legend Overlay */}
        <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-3 rounded-md border border-border-subtle bg-surface/85 px-2.5 py-1 text-caption backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-[#60a5fa]" />
            <span className="text-text-muted">Descent Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-[#3f3f46]" />
            <span className="text-text-muted">Contours f(w)</span>
          </div>
        </div>

        {/* Click/Drag hint */}
        <div className="pointer-events-none absolute bottom-2 left-3 text-caption text-text-muted">
          Click or drag anywhere on the contour plot to set a starting point.
        </div>
      </div>

      {/* Preset Guide Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-label text-text-muted">
          Compare Scenarios:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('zigzag')}
          className={`rounded-md border px-3 py-1.5 text-caption font-medium transition-colors ${
            !useMomentum && learningRate === 0.18
              ? 'border-accent bg-accent/15 text-accent-light'
              : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          High LR (Zig-zag)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('momentum')}
          className={`rounded-md border px-3 py-1.5 text-caption font-medium transition-colors ${
            useMomentum && learningRate === 0.18
              ? 'border-accent bg-accent/15 text-accent-light'
              : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          With Momentum (β = 0.85)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('balanced')}
          className={`rounded-md border px-3 py-1.5 text-caption font-medium transition-colors ${
            !useMomentum && learningRate === 0.08
              ? 'border-accent bg-accent/15 text-accent-light'
              : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          Balanced SGD (LR = 0.08)
        </button>
      </div>

      {/* Diagnostic Context Note for Zig-Zag */}
      {!useMomentum && learningRate >= 0.15 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-caption text-text-secondary">
          <strong className="text-warning">Ravine Zig-Zag:</strong> The surface curves 10×
          steeper along <span className="font-mono text-text-primary">w₂</span> than{' '}
          <span className="font-mono text-text-primary">w₁</span>. A high learning rate causes
          updates to overshoot the steep walls back and forth, wasting steps while crawling along
          the valley floor. Switch on <strong className="text-accent">Momentum</strong> to damp out
          cross-valley bounces.
        </div>
      )}

      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 px-4 py-3">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className={`flex h-8 w-8 items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isPlaying
                  ? 'bg-accent text-white hover:bg-accent-dark'
                  : 'border border-border-subtle bg-elevated text-text-primary hover:border-border-strong hover:bg-hover'
              }`}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>
          </Tooltip>

          <Tooltip content="Next step">
            <button
              type="button"
              onClick={executeStep}
              disabled={isPlaying}
              aria-label="Next step"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="Reset trajectory">
            <button
              type="button"
              onClick={() => handleReset()}
              aria-label="Reset"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Momentum Toggle */}
        <div className="flex items-center">
          <Toggle
            label="Momentum (β = 0.85)"
            checked={useMomentum}
            onChange={(checked) => {
              setUseMomentum(checked);
              velocityRef.current = [0, 0];
            }}
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-label text-text-muted">Speed:</span>
          <div className="flex items-center rounded-md border border-border-subtle bg-elevated p-0.5">
            {[2, 5, 10].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded px-2 py-0.5 text-code-sm transition-colors ${
                  speed === s
                    ? 'bg-accent text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <ControlsGrid columns={2}>
        <Slider
          label="Learning Rate (α)"
          min={0.02}
          max={0.22}
          step={0.01}
          value={learningRate}
          onChange={(val) => setLearningRate(parseFloat(val.toFixed(2)))}
        />
        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-2 text-caption">
          <span className="text-text-muted">Ravine Ratio (Curvature):</span>
          <span className="font-mono text-accent font-semibold">10 : 1</span>
        </div>
      </ControlsGrid>

      {/* Live Numeric Stats */}
      <ControlsGrid columns={4}>
        <Stat
          label="Position w₁"
          value={currentPoint[0].toFixed(3)}
          variant="default"
          subtext="Horizontal axis"
        />
        <Stat
          label="Position w₂"
          value={currentPoint[1].toFixed(3)}
          variant="default"
          subtext="Steep vertical axis"
        />
        <Stat
          label="Loss f(w₁, w₂)"
          value={Number.isFinite(currentLoss) ? currentLoss.toFixed(3) : '∞'}
          variant="accent"
          subtext="w₁² + 10w₂²"
        />
        <Stat
          label="Gradient ||∇f||"
          value={Number.isFinite(gradNorm) ? gradNorm.toFixed(3) : '∞'}
          variant="success"
          subtext={`Iteration: ${history.length - 1}`}
        />
      </ControlsGrid>
    </div>
  );
}
