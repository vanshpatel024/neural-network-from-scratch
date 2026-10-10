import { useState, useMemo, useEffect } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Dices } from 'lucide-react';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { Tooltip } from '@/components/ui/Tooltip';
import { Math as MathEquation } from '@/components/ui/Math';
import {
  computeForwardPass231,
  DEFAULT_WEIGHTS_231,
} from '@/lib/matrix';

export interface NetworkForwardDiagramProps {
  className?: string;
}

export function NetworkForwardDiagram({ className = '' }: NetworkForwardDiagramProps): JSX.Element {
  // Inputs
  const [x1, setX1] = useState<number>(1.0);
  const [x2, setX2] = useState<number>(0.5);

  // Weights (default or randomized)
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS_231);

  // Step Phase: 0 = Input, 1 = Dense1 (Z1), 2 = ReLU (A1), 3 = Dense2 (Z2), 4 = Sigmoid Output (A2)
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-step timer when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : 0));
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Compute forward pass
  const forwardResult = useMemo(() => {
    return computeForwardPass231(x1, x2, weights);
  }, [x1, x2, weights]);

  const { Z1, A1, Z2, A2 } = forwardResult;

  // Step advancement
  const handleNextStep = (): void => {
    setActiveStep((prev) => (prev < 4 ? prev + 1 : 0));
  };

  const handleReset = (): void => {
    setIsPlaying(false);
    setActiveStep(0);
  };

  const handleRandomizeWeights = (): void => {
    // Generate He-like random weights
    const rand = (scale: number): number => parseFloat(((Math.random() * 2 - 1) * scale).toFixed(2));
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

  // Node coordinates on SVG canvas (viewBox 0 0 640 280)
  const inputNodes = [
    { id: 'x1', x: 70, y: 80, label: 'x₁', val: x1 },
    { id: 'x2', x: 70, y: 200, label: 'x₂', val: x2 },
  ];

  const hiddenNodes = [
    { id: 'h1', x: 310, y: 55, label: 'h₁', z: Z1[0]?.[0] ?? 0, a: A1[0]?.[0] ?? 0 },
    { id: 'h2', x: 310, y: 140, label: 'h₂', z: Z1[0]?.[1] ?? 0, a: A1[0]?.[1] ?? 0 },
    { id: 'h3', x: 310, y: 225, label: 'h₃', z: Z1[0]?.[2] ?? 0, a: A1[0]?.[2] ?? 0 },
  ];

  const outputNode = {
    id: 'out',
    x: 550,
    y: 140,
    label: 'ŷ',
    z: Z2[0]?.[0] ?? 0,
    a: A2[0]?.[0] ?? 0,
  };

  // Substituted matrix equations formatting
  const matrixSubstitutedKatex = useMemo(() => {
    if (activeStep <= 1) {
      // Step 1: Z1 = X * W1 + b1
      return `Z^{[1]} = \\begin{bmatrix} ${x1.toFixed(1)} & ${x2.toFixed(1)} \\end{bmatrix} \\begin{bmatrix} ${weights.W1[0]?.[0]?.toFixed(1)} & ${weights.W1[0]?.[1]?.toFixed(1)} & ${weights.W1[0]?.[2]?.toFixed(1)} \\\\ ${weights.W1[1]?.[0]?.toFixed(1)} & ${weights.W1[1]?.[1]?.toFixed(1)} & ${weights.W1[1]?.[2]?.toFixed(1)} \\end{bmatrix} + \\begin{bmatrix} ${weights.b1[0]?.[0]?.toFixed(1)} & ${weights.b1[0]?.[1]?.toFixed(1)} & ${weights.b1[0]?.[2]?.toFixed(1)} \\end{bmatrix} = \\begin{bmatrix} ${(Z1[0]?.[0] ?? 0).toFixed(2)} & ${(Z1[0]?.[1] ?? 0).toFixed(2)} & ${(Z1[0]?.[2] ?? 0).toFixed(2)} \\end{bmatrix}`;
    }
    if (activeStep === 2) {
      // Step 2: A1 = ReLU(Z1)
      return `A^{[1]} = \\text{ReLU}\\left(\\begin{bmatrix} ${(Z1[0]?.[0] ?? 0).toFixed(2)} & ${(Z1[0]?.[1] ?? 0).toFixed(2)} & ${(Z1[0]?.[2] ?? 0).toFixed(2)} \\end{bmatrix}\\right) = \\begin{bmatrix} ${(A1[0]?.[0] ?? 0).toFixed(2)} & ${(A1[0]?.[1] ?? 0).toFixed(2)} & ${(A1[0]?.[2] ?? 0).toFixed(2)} \\end{bmatrix}`;
    }
    if (activeStep === 3) {
      // Step 3: Z2 = A1 * W2 + b2
      return `Z^{[2]} = \\begin{bmatrix} ${(A1[0]?.[0] ?? 0).toFixed(2)} & ${(A1[0]?.[1] ?? 0).toFixed(2)} & ${(A1[0]?.[2] ?? 0).toFixed(2)} \\end{bmatrix} \\begin{bmatrix} ${weights.W2[0]?.[0]?.toFixed(1)} \\\\ ${weights.W2[1]?.[0]?.toFixed(1)} \\\\ ${weights.W2[2]?.[0]?.toFixed(1)} \\end{bmatrix} + \\begin{bmatrix} ${weights.b2[0]?.[0]?.toFixed(1)} \\end{bmatrix} = \\begin{bmatrix} ${(Z2[0]?.[0] ?? 0).toFixed(2)} \\end{bmatrix}`;
    }
    // Step 4: A2 = Sigmoid(Z2)
    return `\\hat{y} = A^{[2]} = \\sigma\\left(\\begin{bmatrix} ${(Z2[0]?.[0] ?? 0).toFixed(2)} \\end{bmatrix}\\right) = \\begin{bmatrix} ${(A2[0]?.[0] ?? 0).toFixed(3)} \\end{bmatrix}`;
  }, [activeStep, x1, x2, weights, Z1, A1, Z2, A2]);

  const stepTitles = [
    'Layer 0: Input Vector X',
    'Layer 1: Linear Matrix Product',
    'Layer 1: Hidden ReLU Activation',
    'Layer 2: Output Linear Step',
    'Layer 2: Final Sigmoid Prediction',
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Stepper Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="text-label text-accent font-mono rounded bg-accent/10 px-2.5 py-0.5">
            Stage {activeStep} of 4:
          </span>
          <span className="font-semibold text-text-primary text-body">
            {stepTitles[activeStep] ?? 'Forward Step'}
          </span>
        </div>

        {/* Randomize Weights Action */}
        <button
          type="button"
          onClick={handleRandomizeWeights}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-caption text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
        >
          <Dices className="h-3.5 w-3.5" />
          <span>Randomize Weights</span>
        </button>
      </div>

      {/* Interactive Network Diagram SVG */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-2">
        <svg
          viewBox="0 0 640 280"
          className="w-full h-auto select-none block"
        >
          {/* Layer Headers */}
          <text x="70" y="22" textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="monospace" fontWeight="600">INPUT (2)</text>
          <text x="310" y="22" textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="monospace" fontWeight="600">HIDDEN DENSE (3)</text>
          <text x="550" y="22" textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="monospace" fontWeight="600">OUTPUT DENSE (1)</text>

          {/* Layer 1 Connections (Input -> Hidden) */}
          {inputNodes.map((inp, i) =>
            hiddenNodes.map((hid, j) => {
              const w = weights.W1[i]?.[j] ?? 0;
              const isLayer1Active = activeStep >= 1;
              const strokeColor = w >= 0 ? '#3b82f6' : '#ef4444';
              const strokeWidth = Math.max(1.5, Math.abs(w) * 2.2);
              return (
                <g key={`l1-${i}-${j}`}>
                  <line
                    x1={inp.x + 22}
                    y1={inp.y}
                    x2={hid.x - 24}
                    y2={hid.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={isLayer1Active ? 0.85 : 0.25}
                    strokeDasharray={activeStep === 1 ? '4 3' : undefined}
                  />
                </g>
              );
            })
          )}

          {/* Layer 2 Connections (Hidden -> Output) */}
          {hiddenNodes.map((hid, j) => {
            const w = weights.W2[j]?.[0] ?? 0;
            const isLayer2Active = activeStep >= 3;
            const strokeColor = w >= 0 ? '#3b82f6' : '#ef4444';
            const strokeWidth = Math.max(1.5, Math.abs(w) * 2.2);
            return (
              <g key={`l2-${j}`}>
                <line
                  x1={hid.x + 24}
                  y1={hid.y}
                  x2={outputNode.x - 22}
                  y2={outputNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={isLayer2Active ? 0.9 : 0.25}
                  strokeDasharray={activeStep === 3 ? '4 3' : undefined}
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
                stroke="#3b82f6"
                strokeWidth={activeStep === 0 ? 3 : 2}
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
          {hiddenNodes.map((hid, idx) => {
            const isHighlighted = activeStep === 1 || activeStep === 2;
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
                <text x={hid.x} y={hid.y + 11} textAnchor="middle" fill={activeStep >= 2 ? '#10b981' : '#a1a1aa'} fontSize="10" fontFamily="monospace">
                  {activeStep >= 2
                    ? `a=${hid.a.toFixed(2)}`
                    : activeStep === 1
                    ? `z=${hid.z.toFixed(2)}`
                    : `b=${(weights.b1[0]?.[idx] ?? 0).toFixed(1)}`}
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
              fill={activeStep === 4 ? '#3b82f6' : '#18181b'}
              stroke="#60a5fa"
              strokeWidth={activeStep === 4 ? 3.5 : 2}
            />
            <text x={outputNode.x} y={outputNode.y - 4} textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="bold">
              {outputNode.label}
            </text>
            <text x={outputNode.x} y={outputNode.y + 11} textAnchor="middle" fill={activeStep === 4 ? '#ffffff' : '#60a5fa'} fontSize="10" fontFamily="monospace" fontWeight="600">
              {activeStep === 4 ? outputNode.a.toFixed(3) : activeStep === 3 ? `z=${outputNode.z.toFixed(2)}` : 'prob'}
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-3 text-caption text-text-muted bg-surface/85 px-2.5 py-1 rounded border border-border-subtle">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span>Positive weight (w &gt; 0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            <span>Negative weight (w &lt; 0)</span>
          </div>
        </div>
      </div>

      {/* Stepper Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Tooltip content={isPlaying ? 'Pause auto-step' : 'Auto-play layer stepping'}>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 text-accent" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>

          <Tooltip content="Step forward one layer">
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 rounded-md border border-accent bg-accent/15 px-3 py-1.5 text-caption font-semibold text-accent-light hover:bg-accent/25 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Step Layer</span>
            </button>
          </Tooltip>

          <Tooltip content="Reset to inputs">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center gap-1.5">
          {['Input X', 'Z^{[1]}', 'A^{[1]}', 'Z^{[2]}', 'Output ŷ'].map((stName, idx) => (
            <button
              key={stName}
              type="button"
              onClick={() => setActiveStep(idx)}
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
          Current Layer Matrix Equation (Evaluated Live):
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

      {/* Final Readouts */}
      <ControlsGrid columns={4}>
        <Stat
          label="Hidden h₁"
          value={`ReLU(${(Z1[0]?.[0] ?? 0).toFixed(2)}) = ${(A1[0]?.[0] ?? 0).toFixed(2)}`}
          variant="default"
          subtext="Neuron 1 activation"
        />
        <Stat
          label="Hidden h₂"
          value={`ReLU(${(Z1[0]?.[1] ?? 0).toFixed(2)}) = ${(A1[0]?.[1] ?? 0).toFixed(2)}`}
          variant="default"
          subtext="Neuron 2 activation"
        />
        <Stat
          label="Hidden h₃"
          value={`ReLU(${(Z1[0]?.[2] ?? 0).toFixed(2)}) = ${(A1[0]?.[2] ?? 0).toFixed(2)}`}
          variant="default"
          subtext="Neuron 3 activation"
        />
        <Stat
          label="Prediction ŷ"
          value={`${((A2[0]?.[0] ?? 0) * 100).toFixed(1)}%`}
          variant="accent"
          subtext={outputNode.a >= 0.5 ? 'Predicted Class 1' : 'Predicted Class 0'}
        />
      </ControlsGrid>
    </div>
  );
}
