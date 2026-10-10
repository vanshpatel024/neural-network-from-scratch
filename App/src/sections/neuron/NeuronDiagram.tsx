import { useState, useMemo, useCallback } from 'react';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Calculator } from 'lucide-react';
import { computeNeuron2D, calculateDecisionBoundary } from '@/lib/neuron';

export interface NeuronDiagramProps {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  b: number;
  onChangeX1: (v: number) => void;
  onChangeX2: (v: number) => void;
  onChangeW1: (v: number) => void;
  onChangeW2: (v: number) => void;
  onChangeB: (v: number) => void;
  onApplyPreset: (w1: number, w2: number, b: number) => void;
}

export function NeuronDiagram({
  x1,
  x2,
  w1,
  w2,
  b,
  onChangeX1,
  onChangeX2,
  onChangeW1,
  onChangeW2,
  onChangeB,
  onApplyPreset,
}: NeuronDiagramProps): JSX.Element {
  const [activeControlTab, setActiveControlTab] = useState<'weights' | 'inputs'>('weights');
  const [showCalculation, setShowCalculation] = useState<boolean>(false);

  const neuron = computeNeuron2D(x1, x2, w1, w2, b);

  // 2D decision boundary dimensions in coordinate space [-3, 3]
  const coordMin = -3;
  const coordMax = 3;
  const svgSize = 340;

  const toSvg = useCallback(
    (x: number, y: number): [number, number] => {
      const sx = ((x - coordMin) / (coordMax - coordMin)) * svgSize;
      const sy = svgSize - ((y - coordMin) / (coordMax - coordMin)) * svgSize;
      return [sx, sy];
    },
    [coordMin, coordMax, svgSize]
  );

  const boundary = useMemo(() => {
    return calculateDecisionBoundary(w1, w2, b, {
      xMin: coordMin,
      xMax: coordMax,
      yMin: coordMin,
      yMax: coordMax,
    });
  }, [w1, w2, b, coordMin, coordMax]);

  const [bx1, by1] = toSvg(boundary.p1[0], boundary.p1[1]);
  const [bx2, by2] = toSvg(boundary.p2[0], boundary.p2[1]);
  const [inputSvgX, inputSvgY] = toSvg(x1, x2);

  // Determine shaded polygon for Class 1 (w1*x + w2*y + b >= 0)
  const class1PolygonPoints = useMemo(() => {
    // Sample corners to see which lie in Class 1 region
    const corners: [number, number][] = [
      [coordMin, coordMin],
      [coordMax, coordMin],
      [coordMax, coordMax],
      [coordMin, coordMax],
    ];

    const inClass1 = (cx: number, cy: number): boolean => w1 * cx + w2 * cy + b >= 0;

    // Use boundary line endpoints and corners in region
    const cornerPtsIn = corners.filter(([cx, cy]) => inClass1(cx, cy));
    if (cornerPtsIn.length === 0) return '';
    if (cornerPtsIn.length === 4) {
      return `0,0 ${svgSize},0 ${svgSize},${svgSize} 0,${svgSize}`;
    }

    // Sort polygon points cyclically around center
    const allPts: [number, number][] = [boundary.p1, ...cornerPtsIn, boundary.p2];
    const center = allPts.reduce(
      (acc, [px, py]) => [acc[0] + px / allPts.length, acc[1] + py / allPts.length],
      [0, 0]
    );

    const sorted = [...allPts].sort((a, bPt) => {
      const angleA = Math.atan2(a[1] - center[1], a[0] - center[0]);
      const angleB = Math.atan2(bPt[1] - center[1], bPt[0] - center[0]);
      return angleA - angleB;
    });

    return sorted
      .map(([px, py]) => {
        const [sx, sy] = toSvg(px, py);
        return `${sx.toFixed(1)},${sy.toFixed(1)}`;
      })
      .join(' ');
  }, [w1, w2, b, boundary, toSvg, svgSize, coordMin, coordMax]);

  const predictedClass = neuron.a >= 0.5 ? 1 : 0;

  return (
    <div className="w-full space-y-6">
      {/* Top Section: Side-by-side Visualizations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Computational Graph SVG */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4">
          <div className="mb-2 text-label text-text-muted">
            Neuron Compute Graph: z = w₁x₁ + w₂x₂ + b
          </div>
          <div className="flex flex-1 items-center justify-center py-2">
            <svg
              viewBox="0 0 380 220"
              className="w-full max-w-[360px] h-auto select-none"
            >
              {/* Input x1 */}
              <circle cx="50" cy="50" r="22" fill="#18181b" stroke="#3b82f6" strokeWidth="2" />
              <text x="50" y="47" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="600" fontFamily="monospace">x₁</text>
              <text x="50" y="62" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace">{x1.toFixed(1)}</text>

              {/* Input x2 */}
              <circle cx="50" cy="170" r="22" fill="#18181b" stroke="#3b82f6" strokeWidth="2" />
              <text x="50" y="167" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="600" fontFamily="monospace">x₂</text>
              <text x="50" y="182" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace">{x2.toFixed(1)}</text>

              {/* Weight edges */}
              <line x1="72" y1="50" x2="165" y2="100" stroke={w1 >= 0 ? '#3b82f6' : '#ef4444'} strokeWidth={Math.max(1.5, Math.abs(w1) * 2)} />
              <line x1="72" y1="170" x2="165" y2="120" stroke={w2 >= 0 ? '#3b82f6' : '#ef4444'} strokeWidth={Math.max(1.5, Math.abs(w2) * 2)} />

              {/* Weight Labels */}
              <rect x="95" y="60" width="46" height="18" rx="4" fill="#121215" stroke="#27272a" />
              <text x="118" y="73" textAnchor="middle" fill={w1 >= 0 ? '#60a5fa' : '#f87171'} fontSize="10" fontFamily="monospace">
                w₁={w1.toFixed(1)}
              </text>

              <rect x="95" y="142" width="46" height="18" rx="4" fill="#121215" stroke="#27272a" />
              <text x="118" y="155" textAnchor="middle" fill={w2 >= 0 ? '#60a5fa' : '#f87171'} fontSize="10" fontFamily="monospace">
                w₂={w2.toFixed(1)}
              </text>

              {/* Bias wire from top */}
              <line x1="185" y1="35" x2="185" y2="82" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
              <rect x="160" y="15" width="50" height="20" rx="4" fill="#121215" stroke="#f59e0b" />
              <text x="185" y="29" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="600" fontFamily="monospace">
                b={b.toFixed(1)}
              </text>

              {/* Summing Junction Node */}
              <circle cx="185" cy="110" r="28" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <text x="185" y="106" textAnchor="middle" fill="#f4f4f5" fontSize="14" fontWeight="bold">Σ</text>
              <text x="185" y="122" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontFamily="monospace">z={neuron.z.toFixed(2)}</text>

              {/* Intermediate connector */}
              <line x1="213" y1="110" x2="252" y2="110" stroke="#71717a" strokeWidth="2" />

              {/* Activation Function Node */}
              <circle cx="275" cy="110" r="23" fill="#18181b" stroke="#3b82f6" strokeWidth="2" />
              <text x="275" y="106" textAnchor="middle" fill="#60a5fa" fontSize="14" fontWeight="600">σ</text>
              <text x="275" y="121" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">Sigmoid</text>

              {/* Output wire */}
              <line x1="298" y1="110" x2="340" y2="110" stroke="#3b82f6" strokeWidth="3" />

              {/* Output y_hat node */}
              <circle cx="355" cy="110" r="16" fill={predictedClass === 1 ? '#3b82f6' : '#27272a'} stroke="#60a5fa" strokeWidth="2" />
              <text x="355" y="114" textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="bold">
                {predictedClass}
              </text>
            </svg>
          </div>
        </div>

        {/* Right: 2D Decision Boundary Space */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-label text-text-muted">
            <span>2D Decision Boundary: w₁x₁ + w₂x₂ + b = 0</span>
            <span className="font-mono text-accent">Region: Class {predictedClass}</span>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <svg
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="w-full max-w-[320px] h-auto rounded-lg border border-border-subtle bg-base select-none"
            >
              {/* Shaded Region for Class 1 (z >= 0) */}
              {class1PolygonPoints && (
                <polygon
                  points={class1PolygonPoints}
                  fill="rgba(59, 130, 246, 0.16)"
                />
              )}

              {/* Grid axes */}
              <line
                x1={toSvg(coordMin, 0)[0]}
                y1={toSvg(coordMin, 0)[1]}
                x2={toSvg(coordMax, 0)[0]}
                y2={toSvg(coordMax, 0)[1]}
                stroke="#27272a"
                strokeWidth="1.5"
              />
              <line
                x1={toSvg(0, coordMin)[0]}
                y1={toSvg(0, coordMin)[1]}
                x2={toSvg(0, coordMax)[0]}
                y2={toSvg(0, coordMax)[1]}
                stroke="#27272a"
                strokeWidth="1.5"
              />

              {/* Decision Boundary Line */}
              <line
                x1={bx1}
                y1={by1}
                x2={bx2}
                y2={by2}
                stroke="#60a5fa"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Origin dot */}
              <circle cx={toSvg(0, 0)[0]} cy={toSvg(0, 0)[1]} r="2" fill="#71717a" />

              {/* Current Input Point (x1, x2) */}
              <circle
                cx={inputSvgX}
                cy={inputSvgY}
                r="7"
                fill={predictedClass === 1 ? '#3b82f6' : '#71717a'}
                stroke="#f4f4f5"
                strokeWidth="2"
              />
              <text
                x={inputSvgX + 10}
                y={inputSvgY - 6}
                fill="#f4f4f5"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="600"
              >
                ({x1.toFixed(1)}, {x2.toFixed(1)})
              </text>
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between text-caption text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent/40" />
              <span>Blue half-plane: Class 1 (a ≥ 0.5)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-base border border-border-subtle" />
              <span>Dark half-plane: Class 0 (a &lt; 0.5)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Deck with Segmented Mode Switcher */}
      <div className="rounded-xl border border-border-subtle bg-surface/90 p-4 space-y-4">
        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <SegmentedControl
            options={[
              { value: 'weights', label: 'Decision Boundary (w₁, w₂, b)' },
              { value: 'inputs', label: 'Test Sample Point (x₁, x₂)' },
            ]}
            value={activeControlTab}
            onChange={setActiveControlTab}
            size="sm"
          />

          {activeControlTab === 'weights' && (
            <div className="flex flex-wrap items-center gap-1.5 text-caption">
              <span className="text-label text-text-muted mr-1">Presets:</span>
              {[
                { label: 'Diagonal', w1: 1.5, w2: 1.5, b: -1.0 },
                { label: 'Vertical', w1: 2.0, w2: 0.0, b: -1.0 },
                { label: 'Horizontal', w1: 0.0, w2: 2.0, b: 0.5 },
                { label: 'Inverted', w1: -1.5, w2: -1.5, b: 0.0 },
              ].map((p) => {
                const isActive =
                  Math.abs(w1 - p.w1) < 0.05 &&
                  Math.abs(w2 - p.w2) < 0.05 &&
                  Math.abs(b - p.b) < 0.05;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onApplyPreset(p.w1, p.w2, p.b)}
                    className={`rounded px-2.5 py-1 text-code-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-accent text-white font-semibold shadow-sm'
                        : 'border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {activeControlTab === 'inputs' && (
            <span className="text-caption text-text-muted">
              Move coordinates to cross the decision boundary.
            </span>
          )}
        </div>

        {/* Sliders for Active Tab */}
        {activeControlTab === 'weights' ? (
          <ControlsGrid columns={3}>
            <Slider
              label="Weight w₁"
              min={-3}
              max={3}
              step={0.1}
              value={w1}
              onChange={(v) => onChangeW1(parseFloat(v.toFixed(1)))}
            />
            <Slider
              label="Weight w₂"
              min={-3}
              max={3}
              step={0.1}
              value={w2}
              onChange={(v) => onChangeW2(parseFloat(v.toFixed(1)))}
            />
            <Slider
              label="Bias b"
              min={-3}
              max={3}
              step={0.1}
              value={b}
              onChange={(v) => onChangeB(parseFloat(v.toFixed(1)))}
            />
          </ControlsGrid>
        ) : (
          <ControlsGrid columns={2}>
            <Slider
              label="Input x₁"
              min={-2.5}
              max={2.5}
              step={0.1}
              value={x1}
              onChange={(v) => onChangeX1(parseFloat(v.toFixed(1)))}
            />
            <Slider
              label="Input x₂"
              min={-2.5}
              max={2.5}
              step={0.1}
              value={x2}
              onChange={(v) => onChangeX2(parseFloat(v.toFixed(1)))}
            />
          </ControlsGrid>
        )}
      </div>

      {/* Live Computation Bar with Optional Step-by-Step Breakdown */}
      <div className="rounded-xl border border-border-subtle bg-surface/80 p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-caption font-mono">
            <span className="text-label text-text-muted">Live Output:</span>
            <span className="text-text-primary font-semibold">z = {neuron.z.toFixed(2)}</span>
            <span className="text-text-muted">→</span>
            <span className="text-accent-light font-bold">a = σ(z) = {neuron.a.toFixed(3)}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                predictedClass === 1
                  ? 'bg-accent/15 text-accent-light border border-accent/30'
                  : 'bg-elevated text-text-secondary border border-border-subtle'
              }`}
            >
              Class {predictedClass}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCalculation((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-caption text-accent hover:text-accent-light transition-colors font-mono cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>{showCalculation ? 'Hide Calculation' : 'Show Full Calculation'}</span>
          </button>
        </div>

        {showCalculation && (
          <div className="mt-2 pt-2 border-t border-border-subtle font-mono text-caption text-text-secondary space-y-1 bg-base/60 p-3 rounded-lg overflow-x-auto">
            <div>
              <span className="text-text-primary font-semibold">z</span> = ({w1.toFixed(1)})({x1.toFixed(1)}) + ({w2.toFixed(1)})({x2.toFixed(1)}) + ({b.toFixed(1)}) ={' '}
              <span className="text-accent-light font-bold">{neuron.z.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-text-primary font-semibold">a</span> = σ({neuron.z.toFixed(3)}) = 1 / (1 + e^(-{neuron.z.toFixed(3)})) ={' '}
              <span className="text-success font-bold">{neuron.a.toFixed(4)}</span>
              <span className="text-text-muted ml-2">→ Predicts Class {predictedClass}</span>
            </div>
          </div>
        )}
      </div>

      {/* Numeric Readouts */}
      <ControlsGrid columns={4}>
        <Stat
          label="Pre-activation z"
          value={neuron.z.toFixed(2)}
          variant="default"
          subtext="w · x + b"
        />
        <Stat
          label="Activation a"
          value={neuron.a.toFixed(3)}
          variant="accent"
          subtext="σ(z) ∈ (0, 1)"
        />
        <Stat
          label="Predicted Class"
          value={`Class ${predictedClass}`}
          variant={predictedClass === 1 ? 'accent' : 'default'}
          subtext={neuron.a >= 0.5 ? 'a ≥ 0.5' : 'a < 0.5'}
        />
        <Stat
          label="Boundary Angle"
          value={boundary.isVertical ? '90°' : `${(Math.atan(boundary.slope ?? 0) * (180 / Math.PI)).toFixed(1)}°`}
          variant="success"
          subtext="Line tilt in 2D space"
        />
      </ControlsGrid>
    </div>
  );
}
