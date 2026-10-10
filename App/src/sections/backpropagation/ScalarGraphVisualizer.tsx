import { useState, useMemo, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { computeDigitClassificationTrace, type DigitTraceStep } from '@/lib/autograd';
import { DIGIT_0_SAMPLE, DIGIT_1_SAMPLE } from '@/lib/digitSamples';
import { Slider } from '@/components/ui/Slider';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { Tooltip } from '@/components/ui/Tooltip';
import { Math as MathEquation } from '@/components/ui/Math';

export interface ScalarGraphVisualizerProps {
  className?: string;
  selectedDigitType?: '0' | '1';
  onSelectSample?: (type: '0' | '1') => void;
  activePixelIdx?: number;
  onSelectPixel?: (idx: number, val: number) => void;
  x?: number;
  onXChange?: (val: number) => void;
  targetY?: 0 | 1;
}

export function ScalarGraphVisualizer({
  className = '',
  selectedDigitType: propDigitType,
  onSelectSample: propOnSelectSample,
  activePixelIdx: propActivePixelIdx,
  x: propX,
  onXChange: propOnXChange,
  targetY: propTargetY,
}: ScalarGraphVisualizerProps): JSX.Element {
  // Digit sample selection fallback
  const [internalDigitType, setInternalDigitType] = useState<'0' | '1'>('1');
  const [internalTargetY, setInternalTargetY] = useState<0 | 1>(1);

  // Active pixel index in 20x20 image fallback (default: center pixel row 10, col 10 = index 210)
  const defaultCenterIdx = 210;
  const [internalPixelIdx] = useState<number>(defaultCenterIdx);

  // Parameter states fallback
  const [internalX, setInternalX] = useState<number>(DIGIT_1_SAMPLE.pixels[defaultCenterIdx] ?? 0.99);
  const [w, setW] = useState<number>(2.0);
  const [b, setB] = useState<number>(-1.0);

  // Effective values
  const selectedDigitType = propDigitType ?? internalDigitType;
  const targetY = propTargetY ?? internalTargetY;
  const activePixelIdx = propActivePixelIdx ?? internalPixelIdx;
  const x = propX ?? internalX;

  // Trace steps: 0 = initial, 1..3 = forward, 4..9 = backward
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // When props change, reset step
  useEffect(() => {
    setCurrentStep(0);
  }, [propX, propDigitType, propTargetY, propActivePixelIdx]);

  // When digit sample changes, update x and targetY
  const handleSelectSample = (type: '0' | '1'): void => {
    if (propOnSelectSample) {
      propOnSelectSample(type);
    } else {
      setInternalDigitType(type);
      setCurrentStep(0);
      if (type === '0') {
        const px = DIGIT_0_SAMPLE.pixels[activePixelIdx] ?? 0.0;
        setInternalX(parseFloat(px.toFixed(2)));
        setInternalTargetY(0);
      } else {
        const px = DIGIT_1_SAMPLE.pixels[activePixelIdx] ?? 0.99;
        setInternalX(parseFloat(px.toFixed(2)));
        setInternalTargetY(1);
      }
    }
  };

  // Compute full digit classification trace
  const trace = useMemo(() => {
    return computeDigitClassificationTrace(x, w, b, targetY);
  }, [x, w, b, targetY]);

  const allSteps: DigitTraceStep[] = useMemo(() => {
    return [...trace.forwardSteps, ...trace.backwardSteps];
  }, [trace]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 9 ? prev + 1 : 0));
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeStepData = currentStep > 0 ? allSteps[currentStep - 1] : null;

  const handleStepForward = (): void => {
    setCurrentStep((prev) => (prev < 9 ? prev + 1 : prev));
  };

  const handleStepBackward = (): void => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleReset = (): void => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Node layout on SVG (spacious viewBox 0 0 840 340)
  // Clean 4-column flow: Inputs (col 1) -> Score (col 2) -> Prediction/Target (col 3) -> Loss (col 4)
  const nodePositions = {
    w: { x: 95, y: 65, label: 'Weight w', op: 'param' },
    x: { x: 95, y: 170, label: 'Pixel x', op: 'input' },
    b: { x: 95, y: 275, label: 'Bias b', op: 'param' },
    z: { x: 315, y: 170, label: 'Logit z', op: 'w·x+b' },
    yHat: { x: 525, y: 120, label: 'Pred ŷ', op: 'σ(z)' },
    y: { x: 525, y: 240, label: 'Target y', op: 'label' },
    loss: { x: 735, y: 180, label: 'BCE Loss', op: 'error' },
  };

  const edges = [
    { from: 'w', to: 'z', fwdStep: 1, bwdStep: 8 },
    { from: 'x', to: 'z', fwdStep: 1, bwdStep: 9 },
    { from: 'b', to: 'z', fwdStep: 1, bwdStep: 7 },
    { from: 'z', to: 'yHat', fwdStep: 2, bwdStep: 6 },
    { from: 'yHat', to: 'loss', fwdStep: 3, bwdStep: 5 },
    { from: 'y', to: 'loss', fwdStep: 3, bwdStep: 0 },
  ];

  // Visibility logic
  const isForwardComputed = (nodeId: string): boolean => {
    if (currentStep === 0) return nodeId === 'w' || nodeId === 'x' || nodeId === 'b' || nodeId === 'y';
    if (nodeId === 'w' || nodeId === 'x' || nodeId === 'b' || nodeId === 'y') return true;
    if (nodeId === 'z') return currentStep >= 1;
    if (nodeId === 'yHat') return currentStep >= 2;
    if (nodeId === 'loss') return currentStep >= 3;
    return false;
  };

  const isGradComputed = (nodeId: string): boolean => {
    if (currentStep < 4) return false;
    if (nodeId === 'loss') return currentStep >= 4;
    if (nodeId === 'yHat') return currentStep >= 5;
    if (nodeId === 'z') return currentStep >= 6;
    if (nodeId === 'b') return currentStep >= 7;
    if (nodeId === 'w') return currentStep >= 8;
    if (nodeId === 'x') return currentStep >= 9;
    return false;
  };

  const getConnectorPath = (fromId: string, toId: string): string => {
    const nFrom = nodePositions[fromId as keyof typeof nodePositions];
    const nTo = nodePositions[toId as keyof typeof nodePositions];
    const x1 = nFrom.x + 59;
    const y1 = nFrom.y;
    const x2 = nTo.x - 59;
    const y2 = nTo.y;
    const dx = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Digit Selector and Sample Preview Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 p-3">
        <div className="flex items-center gap-3">
          {/* Grayscale swatch of active pixel */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-border-strong font-mono text-code-sm font-bold shadow-inner"
            style={{
              backgroundColor: `rgb(${Math.round(x * 255)}, ${Math.round(x * 255)}, ${Math.round(x * 255)})`,
              color: x > 0.5 ? '#000000' : '#ffffff',
            }}
            title={`Pixel grayscale value: ${x.toFixed(2)}`}
          >
            x
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-caption font-semibold text-text-primary">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
              <span>Dataset Sample: Digit {selectedDigitType}</span>
            </div>
            <div className="text-caption text-text-muted font-mono mt-0.5">
              Label: <span className="text-[#10b981] font-semibold">y = {targetY}</span> · Input Feature:{' '}
              <span className="text-accent font-semibold">x = {x.toFixed(2)}</span>
              <span className="ml-1 text-text-muted">
                (Row {Math.floor(activePixelIdx / 20)}, Col {activePixelIdx % 20})
              </span>
            </div>
          </div>
        </div>

        {/* Sample selection pills */}
        <div className="flex items-center gap-1.5 text-caption font-mono">
          <button
            type="button"
            onClick={() => handleSelectSample('0')}
            className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
              selectedDigitType === '0'
                ? 'bg-accent text-white font-semibold shadow-sm'
                : 'text-text-secondary bg-elevated hover:text-text-primary'
            }`}
          >
            Digit 0 (y=0)
          </button>
          <button
            type="button"
            onClick={() => handleSelectSample('1')}
            className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
              selectedDigitType === '1'
                ? 'bg-accent text-white font-semibold shadow-sm'
                : 'text-text-secondary bg-elevated hover:text-text-primary'
            }`}
          >
            Digit 1 (y=1)
          </button>
        </div>
      </div>

      {/* Stepper Status Header with Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="text-label text-accent font-mono rounded bg-accent/10 px-2.5 py-0.5">
            Step {currentStep} of 9:
          </span>
          <span className="font-semibold text-text-primary text-body">
            {currentStep === 0 && 'Ready: Inputs set (w, x, b, y)'}
            {activeStepData && activeStepData.title}
          </span>
        </div>

        {/* Legend cleanly integrated into header */}
        <div className="flex items-center gap-3 text-caption font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span className="text-text-secondary">Forward (val)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="text-text-secondary">Backward (∇)</span>
          </div>
        </div>
      </div>

      {/* Spacious Computational Graph SVG */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-2 sm:p-4">
        <svg
          viewBox="0 0 840 340"
          className="w-full h-auto select-none block"
        >
          <defs>
            {/* Glow Filter for Active Node */}
            <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Column Category Labels for effortless spatial understanding */}
          <g className="text-caption font-mono uppercase tracking-wider" opacity="0.45" fill="#a1a1aa" fontSize="10">
            <text x={95} y={22} textAnchor="middle">Inputs & Params</text>
            <text x={315} y={22} textAnchor="middle">Linear Score</text>
            <text x={525} y={22} textAnchor="middle">Prediction & Target</text>
            <text x={735} y={22} textAnchor="middle">Loss Function</text>
          </g>

          {/* Connection Edges */}
          {edges.map((edge) => {
            const isFwdActive = currentStep === edge.fwdStep;
            const isBwdActive = currentStep === edge.bwdStep;
            const isFwdDone = currentStep >= edge.fwdStep;
            const isBwdDone = edge.bwdStep > 0 && currentStep >= edge.bwdStep;

            let strokeColor = '#27272a';
            let strokeWidth = 1.6;
            let strokeDash: string | undefined;

            if (isBwdActive) {
              strokeColor = '#10b981';
              strokeWidth = 3;
              strokeDash = '6 3';
            } else if (isBwdDone) {
              strokeColor = '#059669';
              strokeWidth = 2.2;
              strokeDash = '5 3';
            } else if (isFwdActive) {
              strokeColor = '#60a5fa';
              strokeWidth = 3;
            } else if (isFwdDone) {
              strokeColor = '#2563eb';
              strokeWidth = 2;
            }

            return (
              <g key={`${edge.from}->${edge.to}`}>
                <path
                  d={getConnectorPath(edge.from, edge.to)}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  opacity={isFwdDone || isBwdDone ? 0.95 : 0.6}
                />
              </g>
            );
          })}

          {/* Node Cards */}
          {Object.entries(nodePositions).map(([id, pos]) => {
            const nodeData = trace.nodes[id];
            const isActive = activeStepData?.activeNodeId === id;
            const fwdReady = isForwardComputed(id);
            const gradReady = isGradComputed(id);

            // Card dimensions: 118 x 56
            const cardW = 118;
            const cardH = 56;
            const cardX = pos.x - 59;
            const cardY = pos.y - 28;

            return (
              <g key={id}>
                {/* Active Outer Ring */}
                {isActive && (
                  <rect
                    x={cardX - 4}
                    y={cardY - 4}
                    width={cardW + 8}
                    height={cardH + 8}
                    rx="12"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity={0.6}
                  />
                )}

                {/* Main Node Card Surface */}
                <rect
                  x={cardX}
                  y={cardY}
                  width={cardW}
                  height={cardH}
                  rx="8"
                  fill={isActive ? '#1e293b' : '#18181b'}
                  stroke={
                    isActive
                      ? '#38bdf8'
                      : gradReady
                        ? '#10b981'
                        : fwdReady
                          ? '#3b82f6'
                          : '#27272a'
                  }
                  strokeWidth={isActive ? 2.5 : 1.5}
                  filter={isActive ? 'url(#active-glow)' : undefined}
                />

                {/* Header: Node Name */}
                <text
                  x={pos.x - 48}
                  y={pos.y - 10}
                  fill="#f4f4f5"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {pos.label}
                </text>

                {/* Header: Operation Pill */}
                <rect
                  x={pos.x + 10}
                  y={pos.y - 21}
                  width="42"
                  height="15"
                  rx="3"
                  fill="#27272a"
                  stroke="#3f3f46"
                  strokeWidth="0.8"
                />
                <text
                  x={pos.x + 31}
                  y={pos.y - 10}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {pos.op}
                </text>

                {/* Card Divider */}
                <line
                  x1={pos.x - 51}
                  y1={pos.y - 2}
                  x2={pos.x + 51}
                  y2={pos.y - 2}
                  stroke="#27272a"
                  strokeWidth="1"
                />

                {/* Data Row 1: Forward Value */}
                <text
                  x={pos.x - 48}
                  y={pos.y + 11}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  val
                </text>
                <text
                  x={pos.x + 48}
                  y={pos.y + 11}
                  textAnchor="end"
                  fill={fwdReady ? '#38bdf8' : '#52525b'}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {fwdReady ? nodeData?.data.toFixed(2) : '—'}
                </text>

                {/* Data Row 2: Backward Gradient */}
                <text
                  x={pos.x - 48}
                  y={pos.y + 23}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  grad
                </text>
                <text
                  x={pos.x + 48}
                  y={pos.y + 23}
                  textAnchor="end"
                  fill={gradReady ? '#34d399' : '#52525b'}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {id === 'y'
                    ? 'const'
                    : gradReady && nodeData?.grad !== undefined
                      ? nodeData.grad.toFixed(2)
                      : '—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stepper Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Tooltip content={isPlaying ? 'Pause trace' : 'Auto-play trace'}>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 text-accent" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>

          <Tooltip content="Previous step">
            <button
              type="button"
              onClick={handleStepBackward}
              disabled={currentStep === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors cursor-pointer"
              aria-label="Previous step"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Next step">
            <button
              type="button"
              onClick={handleStepForward}
              disabled={currentStep >= 9}
              className="flex items-center gap-1.5 rounded-md border border-accent bg-accent/15 px-3 py-1.5 text-caption font-semibold text-accent-light hover:bg-accent/25 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Next Step</span>
            </button>
          </Tooltip>

          <Tooltip content="Reset to start">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors cursor-pointer"
              aria-label="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Step indicator pills */}
        <div className="flex flex-wrap items-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((stepIdx) => {
            const isFwd = stepIdx >= 1 && stepIdx <= 3;
            const isBwd = stepIdx >= 4;
            const isCurrent = currentStep === stepIdx;

            return (
              <button
                key={stepIdx}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(stepIdx);
                }}
                className={`rounded px-2 py-0.5 text-code-sm font-mono transition-colors cursor-pointer ${
                  isCurrent
                    ? isBwd
                      ? 'bg-[#10b981] text-white font-bold shadow-sm'
                      : 'bg-accent text-white font-bold shadow-sm'
                    : isBwd
                      ? 'text-[#34d399]/70 hover:text-[#34d399] bg-elevated/80'
                      : isFwd
                        ? 'text-accent-light/70 hover:text-accent-light bg-elevated/80'
                        : 'text-text-muted hover:text-text-secondary bg-elevated'
                }`}
              >
                {stepIdx === 0 ? 'Init' : stepIdx}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Math & Intuition Explanation Panel */}
      {currentStep === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface/80 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <span className="text-body font-semibold text-text-primary">
              Initial State: Model & Inputs Ready
            </span>
            <span className="rounded px-2.5 py-0.5 text-caption font-semibold bg-accent/15 text-accent-light border border-accent/30">
              Ready
            </span>
          </div>

          <p className="text-body text-text-secondary leading-relaxed">
            The neuron predicts whether the active pixel belongs to <strong>Digit 1</strong>.
            Click <strong>Next Step</strong> to run forward propagation and trace how error flows backward.
          </p>

          <div className="rounded-lg border border-border-subtle bg-base/60 p-3 text-caption font-mono text-center overflow-x-auto text-text-secondary">
            Inputs: <span className="text-accent font-semibold">x = {x.toFixed(2)}</span>,{' '}
            <span className="text-accent font-semibold">w = {w.toFixed(2)}</span>,{' '}
            <span className="text-accent font-semibold">b = {b.toFixed(2)}</span> · Target:{' '}
            <span className="text-[#10b981] font-semibold">y = {targetY}</span>
          </div>
        </div>
      ) : activeStepData ? (
        <div className="rounded-xl border border-border-subtle bg-surface/80 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
            <span className="text-body font-semibold text-text-primary">
              {activeStepData.title}
            </span>
            <span
              className={`rounded px-2.5 py-0.5 text-caption font-semibold ${
                activeStepData.phase === 'forward'
                  ? 'bg-accent/15 text-accent-light border border-accent/30'
                  : 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30'
              }`}
            >
              {activeStepData.phase === 'forward' ? 'Forward Pass' : 'Chain Rule Step'}
            </span>
          </div>

          {/* Forward Pass Card */}
          {activeStepData.phase === 'forward' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border-subtle bg-base/60 p-3 text-center overflow-x-auto font-mono text-caption">
                <MathEquation math={activeStepData.evaluatedEquation} block />
                <div className="text-caption text-text-muted mt-1">
                  Formula: <MathEquation math={activeStepData.symbolicEquation} />
                </div>
              </div>

              <p className="text-body text-text-secondary leading-relaxed">
                {activeStepData.explanation}
              </p>
            </div>
          )}

          {/* Backward Pass Chain Rule Flow */}
          {activeStepData.phase === 'backward' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[#10b981]/30 bg-base/60 p-3.5 space-y-2">
                <div className="text-center overflow-x-auto text-[#34d399] font-mono">
                  <MathEquation math={activeStepData.evaluatedEquation} block />
                </div>

                {activeStepData.incomingGradSymbol && (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1.5 border-t border-border-subtle/50 text-caption text-text-muted font-mono">
                    <span>
                      Incoming: <MathEquation math={activeStepData.incomingGradSymbol} /> = {activeStepData.incomingGradValue}
                    </span>
                    <span>·</span>
                    <span>
                      Local slope: <MathEquation math={activeStepData.localDerivSymbol ?? ''} /> = {activeStepData.localDerivValue}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-body text-text-secondary leading-relaxed">
                {activeStepData.explanation}
              </p>
            </div>
          )}

          {/* Intuitive Takeaway */}
          {activeStepData.intuitionTakeaway && (
            <div className="flex items-start gap-2.5 rounded-lg border border-accent/25 bg-accent/10 p-3 text-text-primary">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-light">
                <Lightbulb className="h-3 w-3" />
              </div>
              <p className="text-caption text-text-secondary leading-relaxed">
                <strong className={activeStepData.phase === 'forward' ? 'text-accent-light' : 'text-[#34d399]'}>
                  Takeaway:{' '}
                </strong>
                {activeStepData.intuitionTakeaway}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Input Sliders */}
      <div className="rounded-xl border border-border-subtle bg-surface/90 p-4 space-y-3">
        <div className="text-label text-text-muted">Neuron Parameters & Pixel Input:</div>
        <ControlsGrid columns={3}>
          <Slider
            label="Synaptic Weight w"
            min={-4.0}
            max={4.0}
            step={0.2}
            value={w}
            onChange={(val) => {
              setW(parseFloat(val.toFixed(2)));
              setCurrentStep(0);
            }}
          />
          <Slider
            label="Neuron Bias b"
            min={-4.0}
            max={4.0}
            step={0.2}
            value={b}
            onChange={(val) => {
              setB(parseFloat(val.toFixed(2)));
              setCurrentStep(0);
            }}
          />
          <Slider
            label="Input Pixel x"
            min={0.0}
            max={1.0}
            step={0.05}
            value={x}
            onChange={(val) => {
              const rounded = parseFloat(val.toFixed(2));
              if (propOnXChange) {
                propOnXChange(rounded);
              } else {
                setInternalX(rounded);
              }
              setCurrentStep(0);
            }}
          />
        </ControlsGrid>
      </div>
    </div>
  );
}
