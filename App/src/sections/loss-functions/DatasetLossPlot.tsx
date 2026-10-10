import { useState, useMemo, useCallback } from 'react';
import {
  computePointsLoss,
  DEFAULT_POINTS_1D,
} from '@/lib/loss';
import { sigmoid } from '@/lib/activations';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ControlsGrid } from '@/components/ui/ControlsGrid';

export interface DatasetLossPlotProps {
  className?: string;
}

export function DatasetLossPlot({ className = '' }: DatasetLossPlotProps): JSX.Element {
  const [w, setW] = useState<number>(2.0);
  const [b, setB] = useState<number>(0.0);

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 260;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 40;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const xMin = -3.5;
  const xMax = 3.5;

  const toSvgX = useCallback(
    (xVal: number): number =>
      padLeft + ((xVal - xMin) / (xMax - xMin)) * plotWidth,
    [padLeft, xMin, xMax, plotWidth]
  );

  const toSvgY = useCallback(
    (prob: number): number =>
      padTop + plotHeight - Math.max(0, Math.min(1, prob)) * plotHeight,
    [padTop, plotHeight]
  );

  // Compute dataset loss
  const { results, totalLoss } = useMemo(() => {
    return computePointsLoss(DEFAULT_POINTS_1D, w, b);
  }, [w, b]);

  // Sigmoid curve path
  const sigmoidCurvePath = useMemo(() => {
    const steps = 100;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const xVal = xMin + (i / steps) * (xMax - xMin);
      const prob = sigmoid(w * xVal + b);
      const sx = toSvgX(xVal).toFixed(1);
      const sy = toSvgY(prob).toFixed(1);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx} ${sy}`);
    }
    return pts.join(' ');
  }, [w, b, toSvgX, toSvgY, xMin, xMax]);

  // Presets
  const applyPreset = (presetW: number, presetB: number): void => {
    setW(presetW);
    setB(presetB);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <span className="text-label text-text-muted">Parameter Presets:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset(2.5, 0.0)}
            className="rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-caption text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            Well-Separated (w=2.5, b=0)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(0.0, 0.0)}
            className="rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-caption text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            Flat (w=0, b=0)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(-2.5, 0.0)}
            className="rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-caption text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            Inverted (w=-2.5, b=0)
          </button>
        </div>
      </div>

      {/* SVG 1D Classifier Plot */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none block"
        >
          {/* Target guidelines for y=1 and y=0 */}
          <line
            x1={padLeft}
            y1={toSvgY(1)}
            x2={svgWidth - padRight}
            y2={toSvgY(1)}
            stroke="#27272a"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1={padLeft}
            y1={toSvgY(0)}
            x2={svgWidth - padRight}
            y2={toSvgY(0)}
            stroke="#27272a"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Decision boundary threshold line at p=0.5 */}
          <line
            x1={padLeft}
            y1={toSvgY(0.5)}
            x2={svgWidth - padRight}
            y2={toSvgY(0.5)}
            stroke="#3f3f46"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={padLeft - 6}
            y={toSvgY(0.5) + 3}
            fill="#71717a"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            0.5
          </text>

          {/* Labels for y=0 and y=1 */}
          <text
            x={padLeft - 6}
            y={toSvgY(1) + 3}
            fill="#3b82f6"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="end"
          >
            y=1
          </text>
          <text
            x={padLeft - 6}
            y={toSvgY(0) + 3}
            fill="#a1a1aa"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            y=0
          </text>

          {/* X axis ticks */}
          {[-3, -2, -1, 0, 1, 2, 3].map((xt) => (
            <g key={xt}>
              <line
                x1={toSvgX(xt)}
                y1={padTop + plotHeight}
                x2={toSvgX(xt)}
                y2={padTop + plotHeight + 5}
                stroke="#3f3f46"
                strokeWidth="1"
              />
              <text
                x={toSvgX(xt)}
                y={padTop + plotHeight + 18}
                fill="#71717a"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {xt}
              </text>
            </g>
          ))}

          {/* Continuous Sigmoid Prediction Curve */}
          <path
            d={sigmoidCurvePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Per-point error bars connecting (x, y) to (x, p) */}
          {results.map(({ point, p: pred, loss }) => {
            const sx = toSvgX(point.x);
            const syTrue = toSvgY(point.y);
            const syPred = toSvgY(pred);
            const isSevere = loss > 0.8;

            return (
              <g key={point.id}>
                {/* Vertical error bar */}
                <line
                  x1={sx}
                  y1={syTrue}
                  x2={sx}
                  y2={syPred}
                  stroke={isSevere ? '#ef4444' : '#10b981'}
                  strokeWidth="2"
                  strokeDasharray="3 2"
                  opacity={0.85}
                />

                {/* Model prediction point on sigmoid curve */}
                <circle
                  cx={sx}
                  cy={syPred}
                  r={4}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* True data point */}
                <circle
                  cx={sx}
                  cy={syTrue}
                  r={6}
                  fill={point.y === 1 ? '#3b82f6' : '#71717a'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Loss text label */}
                <text
                  x={sx}
                  y={point.y === 1 ? syTrue - 10 : syTrue + 18}
                  textAnchor="middle"
                  fill={isSevere ? '#ef4444' : '#a1a1aa'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={isSevere ? '600' : 'normal'}
                >
                  {loss.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="pointer-events-none absolute top-3 right-4 flex items-center gap-4 text-caption bg-surface/90 px-3 py-1.5 rounded-md border border-border-subtle backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span className="text-text-primary">Class 1 True</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#71717a]" />
            <span className="text-text-secondary">Class 0 True</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-[#10b981]" />
            <span className="text-text-secondary">Error Bar</span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <ControlsGrid columns={2}>
        <Slider
          label="Weight (w)"
          min={-3.0}
          max={4.0}
          step={0.1}
          value={w}
          onChange={(val) => setW(parseFloat(val.toFixed(1)))}
        />
        <Slider
          label="Bias (b)"
          min={-3.0}
          max={3.0}
          step={0.1}
          value={b}
          onChange={(val) => setB(parseFloat(val.toFixed(1)))}
        />
      </ControlsGrid>

      {/* Loss Summary */}
      <ControlsGrid columns={3}>
        <Stat
          label="Total Average BCE Loss"
          value={totalLoss.toFixed(4)}
          variant={totalLoss < 0.25 ? 'accent' : 'default'}
          subtext="Mean error across all 6 points"
        />
        <Stat
          label="Decision Boundary x*"
          value={w !== 0 ? (-b / w).toFixed(2) : 'None (flat)'}
          variant="default"
          subtext="Input where prediction p = 0.5"
        />
        <Stat
          label="Sigmoid Slope at Center"
          value={(w * 0.25).toFixed(2)}
          variant="default"
          subtext="w · σ'(0) = 0.25 · w"
        />
      </ControlsGrid>
    </div>
  );
}
