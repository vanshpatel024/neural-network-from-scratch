import { useState, useMemo, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Dices } from 'lucide-react';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { Tooltip } from '@/components/ui/Tooltip';
import { Math as MathEquation } from '@/components/ui/Math';
import {
  computeBackwardPass231,
  DEFAULT_WEIGHTS_231,
} from '@/lib/matrix';

export interface NetworkBackpropDiagramProps {
  className?: string;
}

export function NetworkBackpropDiagram({ className = '' }: NetworkBackpropDiagramProps): JSX.Element {
  // Inputs & target
  const [x1, setX1] = useState<number>(1.0);
  const [x2, setX2] = useState<number>(0.5);
  const [targetY, setTargetY] = useState<0 | 1>(1);

  // Weights (default or randomized)
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS_231);

  // Backward stage:
  // 0 = Forward prediction complete
  // 1 = Output Error dZ[2] = y_hat - y
  // 2 = Layer 2 Gradients dW[2], db[2]
  // 3 = Backprop through ReLU dA[1] -> dZ[1]
  // 4 = Layer 1 Gradients dW[1], db[1]
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Compute backward pass
  const bwdResult = useMemo(() => {
    return computeBackwardPass231(x1, x2, targetY, weights);
  }, [x1, x2, targetY, weights]);

  const { A1, Z1, A2, loss, dZ2, dW2, db2, dA1, dZ1, dW1 } = bwdResult;
  const yHat = A2[0]?.[0] ?? 0;

  // Auto-step timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : 0));
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNextStep = (): void => {
    setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
  };

  const handlePrevStep = (): void => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleReset = (): void => {
    setIsPlaying(false);
    setActiveStep(0);
  };

  const handleRandomizeWeights = (): void => {
    const rand = (scale: number): number =>
      parseFloat(((Math.random() * 2 - 1) * scale).toFixed(2));

    const newWeights = {
      W1: [
        [rand(1.2), rand(1.2), rand(1.2)],
        [rand(1.2), rand(1.2), rand(1.2)],
      ],
      b1: [[rand(0.5), rand(0.5), rand(0.5)]],
      W2: [[rand(1.2)], [rand(1.2)], [rand(1.2)]],
      b2: [[rand(0.5)]],
    };
    setWeights(newWeights);
    setActiveStep(0);
  };

  // Node coordinates on SVG (viewBox 0 0 640 280)
  const inputNodes = [
    { id: 'x1', x: 70, y: 80, label: 'x₁', val: x1 },
    { id: 'x2', x: 70, y: 200, label: 'x₂', val: x2 },
  ];

  const hiddenNodes = [
    { id: 'h1', x: 310, y: 55, label: 'h₁', z: Z1[0]?.[0] ?? 0, a: A1[0]?.[0] ?? 0, dz: dZ1[0]?.[0] ?? 0, da: dA1[0]?.[0] ?? 0 },
    { id: 'h2', x: 310, y: 140, label: 'h₂', z: Z1[0]?.[1] ?? 0, a: A1[0]?.[1] ?? 0, dz: dZ1[0]?.[1] ?? 0, da: dA1[0]?.[1] ?? 0 },
    { id: 'h3', x: 310, y: 225, label: 'h₃', z: Z1[0]?.[2] ?? 0, a: A1[0]?.[2] ?? 0, dz: dZ1[0]?.[2] ?? 0, da: dA1[0]?.[2] ?? 0 },
  ];

  const outputNode = {
    id: 'out',
    x: 550,
    y: 140,
    label: 'ŷ',
    yHat,
    dz: dZ2[0]?.[0] ?? 0,
  };

  const stepTitles = [
    'Stage 0: Forward Pass Ready',
    'Stage 1: Output Error Signal dZ^{[2]} = ŷ - y',
    'Stage 2: Layer 2 Parameter Gradients dW^{[2]} & db^{[2]}',
    'Stage 3: Hidden Error Passing Through ReLU dZ^{[1]}',
    'Stage 4: Layer 1 Parameter Gradients dW^{[1]} & db^{[1]}',
  ];

  // Substituted matrix equation formatting
  const matrixSubstitutedKatex = useMemo(() => {
    if (activeStep === 0) {
      return `\\text{Loss} = L(\\hat{y}, y) = -(${targetY}\\ln(${yHat.toFixed(3)}) + ${1 - targetY}\\ln(${(1 - yHat).toFixed(3)})) = ${loss.toFixed(4)}`;
    }
    if (activeStep === 1) {
      return `dZ^{[2]} = \\hat{y} - y = ${yHat.toFixed(3)} - ${targetY} = \\begin{bmatrix} ${(dZ2[0]?.[0] ?? 0).toFixed(3)} \\end{bmatrix}`;
    }
    if (activeStep === 2) {
      return `dW^{[2]} = (A^{[1]})^T \\cdot dZ^{[2]} = \\begin{bmatrix} ${(A1[0]?.[0] ?? 0).toFixed(2)} \\\\ ${(A1[0]?.[1] ?? 0).toFixed(2)} \\\\ ${(A1[0]?.[2] ?? 0).toFixed(2)} \\end{bmatrix} \\begin{bmatrix} ${(dZ2[0]?.[0] ?? 0).toFixed(3)} \\end{bmatrix} = \\begin{bmatrix} ${(dW2[0]?.[0] ?? 0).toFixed(3)} \\\\ ${(dW2[1]?.[0] ?? 0).toFixed(3)} \\\\ ${(dW2[2]?.[0] ?? 0).toFixed(3)} \\end{bmatrix}, \\quad db^{[2]} = ${(db2[0]?.[0] ?? 0).toFixed(3)}`;
    }
    if (activeStep === 3) {
      return `dZ^{[1]} = \\left(dZ^{[2]} (W^{[2]})^T\\right) \\odot \\mathbf{1}_{Z^{[1]} > 0} = \\begin{bmatrix} ${(dA1[0]?.[0] ?? 0).toFixed(3)} & ${(dA1[0]?.[1] ?? 0).toFixed(3)} & ${(dA1[0]?.[2] ?? 0).toFixed(3)} \\end{bmatrix} \\odot \\begin{bmatrix} ${(Z1[0]?.[0] ?? 0) > 0 ? 1 : 0} & ${(Z1[0]?.[1] ?? 0) > 0 ? 1 : 0} & ${(Z1[0]?.[2] ?? 0) > 0 ? 1 : 0} \\end{bmatrix} = \\begin{bmatrix} ${(dZ1[0]?.[0] ?? 0).toFixed(3)} & ${(dZ1[0]?.[1] ?? 0).toFixed(3)} & ${(dZ1[0]?.[2] ?? 0).toFixed(3)} \\end{bmatrix}`;
    }
    return `dW^{[1]} = X^T \\cdot dZ^{[1]} = \\begin{bmatrix} ${(x1).toFixed(1)} \\\\ ${(x2).toFixed(1)} \\end{bmatrix} \\begin{bmatrix} ${(dZ1[0]?.[0] ?? 0).toFixed(2)} & ${(dZ1[0]?.[1] ?? 0).toFixed(2)} & ${(dZ1[0]?.[2] ?? 0).toFixed(2)} \\end{bmatrix} = \\begin{bmatrix} ${(dW1[0]?.[0] ?? 0).toFixed(3)} & ${(dW1[0]?.[1] ?? 0).toFixed(3)} & ${(dW1[0]?.[2] ?? 0).toFixed(3)} \\\\ ${(dW1[1]?.[0] ?? 0).toFixed(3)} & ${(dW1[1]?.[1] ?? 0).toFixed(3)} & ${(dW1[1]?.[2] ?? 0).toFixed(3)} \\end{bmatrix}`;
  }, [activeStep, targetY, yHat, loss, dZ2, A1, dW2, db2, dA1, Z1, dZ1, x1, x2, dW1]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Header with Target Toggle & Randomize Weights */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="text-label text-accent font-mono rounded bg-accent/10 px-2.5 py-0.5">
            Backprop Step {activeStep} of 4:
          </span>
          <span className="font-semibold text-text-primary text-body">
            {stepTitles[activeStep]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Target label toggle */}
          <div className="inline-flex rounded-md border border-border-subtle bg-surface p-0.5 text-caption">
            <button
              type="button"
              onClick={() => {
                setTargetY(1);
                setActiveStep(0);
              }}
              className={`rounded px-2.5 py-0.5 font-medium transition-colors ${
                targetY === 1 ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              y = 1
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetY(0);
                setActiveStep(0);
              }}
              className={`rounded px-2.5 py-0.5 font-medium transition-colors ${
                targetY === 0 ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              y = 0
            </button>
          </div>

          {/* Randomize weights */}
          <button
            type="button"
            onClick={handleRandomizeWeights}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-caption text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <Dices className="h-3.5 w-3.5" />
            <span>Randomize</span>
          </button>
        </div>
      </div>

      {/* SVG Network with Gradient Edges */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-2">
        <svg
          viewBox="0 0 640 280"
          className="w-full h-auto select-none block"
        >
          {/* Layer Headers */}
          <text x="70" y="22" textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="monospace" fontWeight="600">INPUT (2)</text>
          <text x="310" y="22" textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="monospace" fontWeight="600">HIDDEN (3)</text>
          <text x="550" y="22" textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="monospace" fontWeight="600">OUTPUT (1)</text>

          {/* Layer 1 Connections (Input -> Hidden) */}
          {inputNodes.map((inp, i) =>
            hiddenNodes.map((hid, j) => {
              const gradW = dW1[i]?.[j] ?? 0;
              const isHighlight = activeStep === 4;
              const strokeColor = gradW >= 0 ? '#3b82f6' : '#ef4444';
              const strokeWidth = isHighlight ? Math.max(2.0, Math.min(6.0, Math.abs(gradW) * 4.0)) : 1.5;

              return (
                <g key={`l1-${i}-${j}`}>
                  <line
                    x1={inp.x + 22}
                    y1={inp.y}
                    x2={hid.x - 24}
                    y2={hid.y}
                    stroke={isHighlight ? strokeColor : '#3f3f46'}
                    strokeWidth={strokeWidth}
                    opacity={isHighlight ? 0.95 : 0.25}
                    strokeDasharray={isHighlight ? '4 3' : undefined}
                  />
                </g>
              );
            })
          )}

          {/* Layer 2 Connections (Hidden -> Output) */}
          {hiddenNodes.map((hid, j) => {
            const gradW = dW2[j]?.[0] ?? 0;
            const isHighlight = activeStep === 2;
            const strokeColor = gradW >= 0 ? '#3b82f6' : '#ef4444';
            const strokeWidth = isHighlight ? Math.max(2.0, Math.min(6.0, Math.abs(gradW) * 5.0)) : 1.5;

            return (
              <g key={`l2-${j}`}>
                <line
                  x1={hid.x + 24}
                  y1={hid.y}
                  x2={outputNode.x - 22}
                  y2={outputNode.y}
                  stroke={isHighlight ? strokeColor : '#3f3f46'}
                  strokeWidth={strokeWidth}
                  opacity={isHighlight ? 0.95 : 0.25}
                  strokeDasharray={isHighlight ? '4 3' : undefined}
                />
              </g>
            );
          })}

          {/* Input Nodes */}
          {inputNodes.map((inp) => (
            <g key={inp.id}>
              <circle
                cx={inp.x}
                cy={inp.y}
                r="22"
                fill="#18181b"
                stroke={activeStep === 4 ? '#60a5fa' : '#3f3f46'}
                strokeWidth={activeStep === 4 ? 3 : 1.5}
              />
              <text x={inp.x} y={inp.y - 3} textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="600" fontFamily="monospace">
                {inp.label}
              </text>
              <text x={inp.x} y={inp.y + 12} textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace">
                {inp.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Hidden Nodes */}
          {hiddenNodes.map((hid) => {
            const isBlocked = hid.z <= 0;
            const isHighlighted = activeStep === 3 || activeStep === 2;

            return (
              <g key={hid.id}>
                <circle
                  cx={hid.x}
                  cy={hid.y}
                  r="24"
                  fill="#18181b"
                  stroke={isHighlighted ? '#60a5fa' : '#3f3f46'}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                />
                <text x={hid.x} y={hid.y - 4} textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="600" fontFamily="monospace">
                  {hid.label}
                </text>
                <text
                  x={hid.x}
                  y={hid.y + 11}
                  textAnchor="middle"
                  fill={activeStep >= 3 ? (isBlocked ? '#ef4444' : '#10b981') : '#a1a1aa'}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {activeStep >= 3
                    ? (isBlocked ? 'dZ=0 (gate)' : `dZ=${hid.dz.toFixed(2)}`)
                    : `a=${hid.a.toFixed(2)}`}
                </text>
              </g>
            );
          })}

          {/* Output Node */}
          <g>
            <circle
              cx={outputNode.x}
              cy={outputNode.y}
              r="24"
              fill={activeStep === 1 ? '#1e3a8a' : '#18181b'}
              stroke={activeStep === 1 ? '#60a5fa' : '#3f3f46'}
              strokeWidth={activeStep === 1 ? 3.5 : 2}
            />
            <text x={outputNode.x} y={outputNode.y - 4} textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="bold">
              {outputNode.label}
            </text>
            <text
              x={outputNode.x}
              y={outputNode.y + 11}
              textAnchor="middle"
              fill={activeStep >= 1 ? '#ef4444' : '#60a5fa'}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="600"
            >
              {activeStep >= 1 ? `dZ=${outputNode.dz.toFixed(2)}` : outputNode.yHat.toFixed(3)}
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-3 text-caption text-text-muted bg-surface/85 px-2.5 py-1 rounded border border-border-subtle">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span>Positive gradient (∂L/∂W &gt; 0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            <span>Negative gradient (∂L/∂W &lt; 0)</span>
          </div>
        </div>
      </div>

      {/* Stepper Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Tooltip content={isPlaying ? 'Pause auto-backprop' : 'Auto-play backpropagation'}>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 text-accent" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>

          <Tooltip content="Previous backprop stage">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
              aria-label="Previous step"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Step backward one layer">
            <button
              type="button"
              onClick={handleNextStep}
              disabled={activeStep >= 4}
              className="flex items-center gap-1.5 rounded-md border border-accent bg-accent/15 px-3 py-1.5 text-caption font-semibold text-accent-light hover:bg-accent/25 disabled:opacity-30 transition-colors"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Step Backward</span>
            </button>
          </Tooltip>

          <Tooltip content="Reset to start">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              aria-label="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center gap-1.5">
          {['Fwd Ready', 'dZ^{[2]}', 'dW^{[2]}', 'dZ^{[1]}', 'dW^{[1]}'].map((stName, idx) => (
            <button
              key={stName}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActiveStep(idx);
              }}
              className={`rounded px-2 py-0.5 text-code-sm font-mono transition-colors ${
                activeStep === idx
                  ? 'bg-accent text-white font-semibold'
                  : 'text-text-muted hover:text-text-secondary bg-elevated'
              }`}
            >
              {idx}. {stName}
            </button>
          ))}
        </div>
      </div>

      {/* Live Substituted Matrix Formula */}
      <div className="rounded-lg border border-border-subtle bg-base/60 p-4 overflow-x-auto text-center font-mono">
        <div className="text-label text-text-muted mb-2 text-left">
          Current Backward Matrix Equation (Evaluated Live):
        </div>
        <MathEquation math={matrixSubstitutedKatex} block={false} />
      </div>

      {/* Input Sliders */}
      <ControlsGrid columns={2}>
        <Slider
          label="Input x₁"
          min={-2}
          max={2}
          step={0.1}
          value={x1}
          onChange={(v) => {
            setX1(parseFloat(v.toFixed(1)));
            setActiveStep(0);
          }}
        />
        <Slider
          label="Input x₂"
          min={-2}
          max={2}
          step={0.1}
          value={x2}
          onChange={(v) => {
            setX2(parseFloat(v.toFixed(1)));
            setActiveStep(0);
          }}
        />
      </ControlsGrid>

      {/* Gradient Readouts */}
      <ControlsGrid columns={3}>
        <Stat
          label="Output Error dZ^[2]"
          value={(dZ2[0]?.[0] ?? 0).toFixed(3)}
          variant="default"
          subtext={`ŷ - y = ${yHat.toFixed(2)} - ${targetY}`}
        />
        <Stat
          label="Bias Gradient db^[2]"
          value={(db2[0]?.[0] ?? 0).toFixed(3)}
          variant="default"
          subtext="Equals dZ^[2]"
        />
        <Stat
          label="BCE Loss"
          value={loss.toFixed(4)}
          variant="accent"
          subtext={`Target y = ${targetY}`}
        />
      </ControlsGrid>
    </div>
  );
}
