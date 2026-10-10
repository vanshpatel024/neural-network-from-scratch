import { useState, useMemo, useCallback } from 'react';
import { bce, mse, dBce, dMse } from '@/lib/loss';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ControlsGrid } from '@/components/ui/ControlsGrid';

export interface BceVsMsePlotProps {
  className?: string;
}

export function BceVsMsePlot({ className = '' }: BceVsMsePlotProps): JSX.Element {
  const [targetY, setTargetY] = useState<0 | 1>(1);
  const [p, setP] = useState<number>(0.7);

  // SVG canvas dimensions
  const svgWidth = 560;
  const svgHeight = 280;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;
  const maxLossDisplay = 4.0;

  // Coordinate mappers
  const toSvgX = useCallback(
    (prob: number): number => padLeft + prob * plotWidth,
    [padLeft, plotWidth]
  );

  const toSvgY = useCallback(
    (lossVal: number): number => {
      const clamped = Math.min(maxLossDisplay, Math.max(0, lossVal));
      return padTop + plotHeight - (clamped / maxLossDisplay) * plotHeight;
    },
    [padTop, plotHeight]
  );

  // Generate curve path data
  const { bcePath, msePath } = useMemo(() => {
    const steps = 120;
    const bcePoints: string[] = [];
    const msePoints: string[] = [];

    for (let i = 1; i < steps; i++) {
      const prob = i / steps;
      const bceVal = bce(prob, targetY);
      const mseVal = mse(prob, targetY);

      const sx = toSvgX(prob).toFixed(1);
      const syBce = toSvgY(bceVal).toFixed(1);
      const syMse = toSvgY(mseVal).toFixed(1);

      bcePoints.push(`${i === 1 ? 'M' : 'L'} ${sx} ${syBce}`);
      msePoints.push(`${i === 1 ? 'M' : 'L'} ${sx} ${syMse}`);
    }

    return {
      bcePath: bcePoints.join(' '),
      msePath: msePoints.join(' '),
    };
  }, [targetY, toSvgX, toSvgY]);

  // Current values
  const currentBce = bce(p, targetY);
  const currentMse = mse(p, targetY);
  const currentDbce = dBce(p, targetY);
  const currentDmse = dMse(p, targetY);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Target Class Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="text-label text-text-muted">Target Label (y):</span>
          <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setTargetY(1)}
              className={`rounded-md px-3 py-1 text-caption font-semibold transition-colors ${
                targetY === 1
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Class 1 (y = 1)
            </button>
            <button
              type="button"
              onClick={() => setTargetY(0)}
              className={`rounded-md px-3 py-1 text-caption font-semibold transition-colors ${
                targetY === 0
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Class 0 (y = 0)
            </button>
          </div>
        </div>

        <div className="text-caption text-text-secondary">
          {targetY === 1
            ? 'Model wants p close to 1.0'
            : 'Model wants p close to 0.0'}
        </div>
      </div>

      {/* SVG Comparison Curve Plot */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none block"
        >
          {/* Grid lines */}
          {[1, 2, 3, 4].map((lossLevel) => (
            <g key={lossLevel}>
              <line
                x1={padLeft}
                y1={toSvgY(lossLevel)}
                x2={svgWidth - padRight}
                y2={toSvgY(lossLevel)}
                stroke="#27272a"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={toSvgY(lossLevel) + 3}
                fill="#71717a"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {lossLevel.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Prob tick marks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((probTick) => (
            <g key={probTick}>
              <line
                x1={toSvgX(probTick)}
                y1={padTop + plotHeight}
                x2={toSvgX(probTick)}
                y2={padTop}
                stroke="#27272a"
                strokeDasharray="2 4"
                strokeWidth="1"
              />
              <text
                x={toSvgX(probTick)}
                y={padTop + plotHeight + 16}
                fill="#71717a"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {probTick.toFixed(2)}
              </text>
            </g>
          ))}

          {/* BCE Curve */}
          <path
            d={bcePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* MSE Curve */}
          <path
            d={msePath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />

          {/* Draggable Position Vertical Guideline */}
          <line
            x1={toSvgX(p)}
            y1={padTop}
            x2={toSvgX(p)}
            y2={padTop + plotHeight}
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* MSE Point on curve */}
          <circle
            cx={toSvgX(p)}
            cy={toSvgY(currentMse)}
            r={5}
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* BCE Point on curve */}
          <circle
            cx={toSvgX(p)}
            cy={toSvgY(currentBce)}
            r={6}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* Axis Labels */}
          <text
            x={svgWidth - padRight}
            y={padTop + plotHeight + 30}
            fill="#a1a1aa"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            Predicted Probability (p) →
          </text>
          <text
            x={padLeft}
            y={padTop - 8}
            fill="#a1a1aa"
            fontSize="10"
            fontFamily="monospace"
          >
            ↑ Loss Value L
          </text>
        </svg>

        {/* Legend */}
        <div className="pointer-events-none absolute top-3 right-4 flex items-center gap-4 text-caption bg-surface/90 px-3 py-1.5 rounded-md border border-border-subtle backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-[#3b82f6]" />
            <span className="text-text-primary font-medium">BCE Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-[#a855f7]" />
            <span className="text-text-secondary">MSE Loss</span>
          </div>
        </div>
      </div>

      {/* Probability Slider */}
      <Slider
        label="Predicted Probability (p)"
        min={0.01}
        max={0.99}
        step={0.01}
        value={p}
        onChange={(val) => setP(parseFloat(val.toFixed(2)))}
      />

      {/* Real-time Metric Readouts */}
      <ControlsGrid columns={4}>
        <Stat
          label="BCE Loss"
          value={currentBce > 10 ? '> 10.0' : currentBce.toFixed(3)}
          variant="accent"
          subtext={`-ln(${targetY === 1 ? p.toFixed(2) : (1 - p).toFixed(2)})`}
        />
        <Stat
          label="BCE Gradient dL/dp"
          value={currentDbce.toFixed(2)}
          variant="default"
          subtext="(p - y) / (p(1 - p))"
        />
        <Stat
          label="MSE Loss"
          value={currentMse.toFixed(3)}
          variant="default"
          subtext={`(p - ${targetY})²`}
        />
        <Stat
          label="MSE Gradient dL/dp"
          value={currentDmse.toFixed(2)}
          variant="default"
          subtext={`2 · (p - ${targetY})`}
        />
      </ControlsGrid>
    </div>
  );
}
