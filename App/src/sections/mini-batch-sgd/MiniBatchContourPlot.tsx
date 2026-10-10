import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ELONGATED_BOWL_2D } from '@/lib/optim';
import { PRNG } from '@/lib/nn/prng';

export function MiniBatchContourPlot(): JSX.Element {
  const [batchSize, setBatchSize] = useState<number>(16);
  const [learningRate, setLearningRate] = useState<number>(0.12);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const initialPoint = ELONGATED_BOWL_2D.defaultPoint;

  // Single path state
  const [path, setPath] = useState<[number, number][]>([initialPoint]);
  const [stepCount, setStepCount] = useState<number>(0);

  // Multi-path comparison states
  const [sgdPath, setSgdPath] = useState<[number, number][]>([initialPoint]);
  const [miniPath, setMiniPath] = useState<[number, number][]>([initialPoint]);
  const [batchPath, setBatchPath] = useState<[number, number][]>([initialPoint]);

  // Synchronous refs for animation loop
  const pointRef = useRef<[number, number]>(initialPoint);
  const sgdRef = useRef<[number, number]>(initialPoint);
  const miniRef = useRef<[number, number]>(initialPoint);
  const batchRef = useRef<[number, number]>(initialPoint);
  const prngRef = useRef<PRNG>(new PRNG(1337));

  // SVG coordinate dimensions
  const svgWidth = 600;
  const svgHeight = 340;
  const xRange = ELONGATED_BOWL_2D.xRange; // [-3, 3]
  const yRange = ELONGATED_BOWL_2D.yRange; // [-1.8, 1.8]

  const toSvgX = useCallback(
    (x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * svgWidth,
    [xRange]
  );
  const toSvgY = useCallback(
    (y: number) => svgHeight - ((y - yRange[0]) / (yRange[1] - yRange[0])) * svgHeight,
    [yRange]
  );

  const stepOptimizer = useCallback(
    (
      current: [number, number],
      bSize: number,
      lr: number
    ): [number, number] => {
      const grad = ELONGATED_BOWL_2D.grad(current[0], current[1]);
      const prng = prngRef.current;

      // Noise scales inversely with square root of batch size
      // At full batch (bSize >= 64), noise is 0
      const noiseScale = bSize >= 64 ? 0 : 0.45 / Math.sqrt(bSize);
      const noiseX = prng.gaussian(0, noiseScale);
      const noiseY = prng.gaussian(0, noiseScale);

      const noisyGradX = grad[0] + noiseX;
      const noisyGradY = grad[1] + noiseY;

      const nextX = current[0] - lr * noisyGradX;
      const nextY = current[1] - lr * noisyGradY;

      // Clamp to visual boundaries
      const clampedX = Math.max(-2.9, Math.min(2.9, nextX));
      const clampedY = Math.max(-1.7, Math.min(1.7, nextY));

      return [clampedX, clampedY];
    },
    []
  );

  const handleStep = useCallback(() => {
    if (showComparison) {
      const nextSgd = stepOptimizer(sgdRef.current, 1, learningRate);
      const nextMini = stepOptimizer(miniRef.current, 16, learningRate);
      const nextBatch = stepOptimizer(batchRef.current, 64, learningRate);

      sgdRef.current = nextSgd;
      miniRef.current = nextMini;
      batchRef.current = nextBatch;

      setSgdPath((p) => [...p, nextSgd]);
      setMiniPath((p) => [...p, nextMini]);
      setBatchPath((p) => [...p, nextBatch]);
    } else {
      const next = stepOptimizer(pointRef.current, batchSize, learningRate);
      pointRef.current = next;
      setPath((p) => [...p, next]);
    }
    setStepCount((c) => c + 1);
  }, [batchSize, learningRate, showComparison, stepOptimizer]);

  // Animation tick
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      handleStep();
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, handleStep]);

  const handleReset = () => {
    setIsPlaying(false);
    prngRef.current = new PRNG(1337);
    pointRef.current = initialPoint;
    sgdRef.current = initialPoint;
    miniRef.current = initialPoint;
    batchRef.current = initialPoint;
    setPath([initialPoint]);
    setSgdPath([initialPoint]);
    setMiniPath([initialPoint]);
    setBatchPath([initialPoint]);
    setStepCount(0);
  };

  const activePoint = showComparison
    ? miniPath[miniPath.length - 1] ?? initialPoint
    : path[path.length - 1] ?? initialPoint;
  const currentLoss = ELONGATED_BOWL_2D.f(activePoint[0], activePoint[1]);

  // Precomputed contour paths
  const renderedContours = useMemo(() => {
    const a = 1;
    const b = 10;
    const levels = [0.1, 0.4, 0.9, 1.6, 2.5, 3.6, 5.0, 7.0];
    return levels.map((level) => {
      const rx = Math.sqrt(level / a);
      const ry = Math.sqrt(level / b);
      const cx = toSvgX(0);
      const cy = toSvgY(0);
      const sRx = (rx / (xRange[1] - xRange[0])) * svgWidth;
      const sRy = (ry / (yRange[1] - yRange[0])) * svgHeight;
      return { level, cx, cy, rx: sRx, ry: sRy };
    });
  }, [toSvgX, toSvgY, xRange, yRange]);

  const pathToSvgPath = (pts: [number, number][]) => {
    if (pts.length === 0) return '';
    return pts
      .map((pt, i) => {
        const sx = toSvgX(pt[0]).toFixed(1);
        const sy = toSvgY(pt[1]).toFixed(1);
        return i === 0 ? `M ${sx} ${sy}` : `L ${sx} ${sy}`;
      })
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 w-full">
      {/* Top Controls: Mode Switcher & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label="Batch size presets">
          <button
            type="button"
            onClick={() => {
              setShowComparison(false);
              setBatchSize(1);
              handleReset();
            }}
            className={`px-2.5 py-1.5 text-caption font-semibold rounded-lg border transition-all cursor-pointer ${
              !showComparison && batchSize === 1
                ? 'bg-warning/15 border-warning text-warning shadow-xs'
                : 'bg-elevated/60 border-border-subtle text-text-muted hover:text-text-primary'
            }`}
          >
            SGD (B=1)
          </button>
          <button
            type="button"
            onClick={() => {
              setShowComparison(false);
              setBatchSize(16);
              handleReset();
            }}
            className={`px-2.5 py-1.5 text-caption font-semibold rounded-lg border transition-all cursor-pointer ${
              !showComparison && batchSize === 16
                ? 'bg-accent/15 border-accent text-accent-light shadow-xs'
                : 'bg-elevated/60 border-border-subtle text-text-muted hover:text-text-primary'
            }`}
          >
            Mini-batch (B=16)
          </button>
          <button
            type="button"
            onClick={() => {
              setShowComparison(false);
              setBatchSize(64);
              handleReset();
            }}
            className={`px-2.5 py-1.5 text-caption font-semibold rounded-lg border transition-all cursor-pointer ${
              !showComparison && batchSize === 64
                ? 'bg-success/15 border-success text-success shadow-xs'
                : 'bg-elevated/60 border-border-subtle text-text-muted hover:text-text-primary'
            }`}
          >
            Full Batch (B=64)
          </button>
        </div>

        {/* Toggle Compare All */}
        <button
          type="button"
          onClick={() => {
            setShowComparison(!showComparison);
            handleReset();
          }}
          className={`px-3 py-1.5 text-caption font-semibold rounded-lg border transition-all cursor-pointer ${
            showComparison
              ? 'bg-accent text-white border-accent shadow-xs'
              : 'bg-elevated/60 border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          {showComparison ? 'Comparing All 3 Modes' : 'Compare All 3 Modes'}
        </button>
      </div>

      {/* Sliders */}
      {!showComparison && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
          <Slider
            label="Batch Size (B)"
            value={batchSize}
            min={1}
            max={64}
            step={1}
            onChange={(v) => {
              setBatchSize(v);
              handleReset();
            }}
            formatValue={(v) => (v === 1 ? '1 (Pure SGD)' : v === 64 ? '64 (Full Batch)' : `${v}`)}
          />
          <Slider
            label="Learning Rate"
            value={learningRate}
            min={0.05}
            max={0.25}
            step={0.01}
            onChange={setLearningRate}
            formatValue={(v) => v.toFixed(2)}
          />
        </div>
      )}

      {/* SVG 2D Contour Canvas */}
      <div className="relative w-full aspect-[600/340] max-h-[360px] rounded-xl overflow-hidden border border-border-subtle bg-base shadow-inner">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full block"
          role="img"
          aria-label="2D loss contour showing gradient descent paths under different batch sizes"
        >
          {/* Background Contours */}
          {renderedContours.map((c, idx) => (
            <ellipse
              key={`contour-${idx}`}
              cx={c.cx}
              cy={c.cy}
              rx={Math.max(1, c.rx)}
              ry={Math.max(1, c.ry)}
              fill="none"
              stroke="#27272a"
              strokeWidth="1.2"
              strokeDasharray={idx % 2 === 0 ? 'none' : '4 3'}
            />
          ))}

          {/* Coordinate axes */}
          <line
            x1={0}
            y1={toSvgY(0)}
            x2={svgWidth}
            y2={toSvgY(0)}
            stroke="#1c1c20"
            strokeWidth="1"
          />
          <line
            x1={toSvgX(0)}
            y1={0}
            x2={toSvgX(0)}
            y2={svgHeight}
            stroke="#1c1c20"
            strokeWidth="1"
          />

          {/* Target minimum point */}
          <circle
            cx={toSvgX(0)}
            cy={toSvgY(0)}
            r="4"
            fill="#10b981"
          />

          {/* Paths rendering */}
          {showComparison ? (
            <>
              {/* SGD Path (Amber) */}
              <path
                d={pathToSvgPath(sgdPath)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                opacity="0.85"
              />
              <circle
                cx={toSvgX(sgdRef.current[0])}
                cy={toSvgY(sgdRef.current[1])}
                r="5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Mini-batch Path (Blue) */}
              <path
                d={pathToSvgPath(miniPath)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.2"
                opacity="0.9"
              />
              <circle
                cx={toSvgX(miniRef.current[0])}
                cy={toSvgY(miniRef.current[1])}
                r="5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Full Batch Path (Green) */}
              <path
                d={pathToSvgPath(batchPath)}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                opacity="0.95"
              />
              <circle
                cx={toSvgX(batchRef.current[0])}
                cy={toSvgY(batchRef.current[1])}
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </>
          ) : (
            <>
              <path
                d={pathToSvgPath(path)}
                fill="none"
                stroke={batchSize === 1 ? '#f59e0b' : batchSize >= 64 ? '#10b981' : '#3b82f6'}
                strokeWidth="2.2"
              />
              {/* Start marker */}
              <circle
                cx={toSvgX(initialPoint[0])}
                cy={toSvgY(initialPoint[1])}
                r="4.5"
                fill="#64748b"
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              {/* Active position */}
              <circle
                cx={toSvgX(pointRef.current[0])}
                cy={toSvgY(pointRef.current[1])}
                r="6"
                fill={batchSize === 1 ? '#f59e0b' : batchSize >= 64 ? '#10b981' : '#3b82f6'}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Comparison Legend Overlay */}
        {showComparison && (
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 p-2 rounded-lg bg-surface/90 border border-border-subtle backdrop-blur-xs text-caption">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-text-secondary">SGD (B=1): Noisy exploration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              <span className="text-text-secondary">Mini-batch (B=16): Balanced</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-text-secondary">Full Batch (B=64): Smooth curve</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Run Bar & Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg bg-accent text-white font-medium text-caption inline-flex items-center gap-1.5 hover:bg-accentLight transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleStep}
            disabled={isPlaying}
            className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-elevated/60 text-text-secondary hover:text-text-primary text-caption inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-elevated/60 text-text-secondary hover:text-text-primary text-caption inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <Stat label="Step" value={stepCount} />
          <Stat label="Loss" value={currentLoss.toFixed(3)} />
          <Stat
            label="Noise Level"
            value={
              showComparison
                ? 'Multi'
                : batchSize === 1
                ? 'High'
                : batchSize >= 64
                ? 'None'
                : 'Moderate'
            }
          />
        </div>
      </div>
    </div>
  );
}

export default MiniBatchContourPlot;
