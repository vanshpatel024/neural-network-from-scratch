import { useState, useMemo } from 'react';
import { Crosshair, ZoomIn, Sparkles, CheckCircle2 } from 'lucide-react';
import { DIGIT_0_SAMPLE, DIGIT_1_SAMPLE, type DigitSample } from '@/lib/digitSamples';

export interface PixelInspectorProps {
  className?: string;
  selectedDigitType?: '0' | '1';
  onSelectSample?: (type: '0' | '1') => void;
  activePixelIdx?: number;
  onSelectPixel?: (idx: number, val: number) => void;
  x?: number;
  targetY?: 0 | 1;
}

export function PixelInspector({
  className = '',
  selectedDigitType: propDigitType,
  onSelectSample: propOnSelectSample,
  activePixelIdx: propActivePixelIdx,
  onSelectPixel: propOnSelectPixel,
  x: propX,
  targetY: propTargetY,
}: PixelInspectorProps): JSX.Element {
  // Internal state fallback for standalone usage
  const [internalDigitType, setInternalDigitType] = useState<'0' | '1'>('1');
  const [internalPixelIdx, setInternalPixelIdx] = useState<number>(210); // Row 10, Col 10
  const [internalX, setInternalX] = useState<number>(DIGIT_1_SAMPLE.pixels[210] ?? 0.99);
  const [internalTargetY, setInternalTargetY] = useState<0 | 1>(1);

  // Active state resolution
  const digitType = propDigitType ?? internalDigitType;
  const activeIdx = propActivePixelIdx ?? internalPixelIdx;
  const currentX = propX ?? internalX;
  const currentTargetY = propTargetY ?? internalTargetY;

  // Hover state for interactive preview
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeSample: DigitSample = digitType === '0' ? DIGIT_0_SAMPLE : DIGIT_1_SAMPLE;

  const activeRow = Math.floor(activeIdx / 20);
  const activeCol = activeIdx % 20;

  const displayIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const displayRow = Math.floor(displayIdx / 20);
  const displayCol = displayIdx % 20;
  const displayVal = activeSample.pixels[displayIdx] ?? 0;

  // Change digit sample
  const handleSampleSwitch = (type: '0' | '1'): void => {
    if (propOnSelectSample) {
      propOnSelectSample(type);
    } else {
      setInternalDigitType(type);
      const newY = type === '0' ? 0 : 1;
      setInternalTargetY(newY);
      const sample = type === '0' ? DIGIT_0_SAMPLE : DIGIT_1_SAMPLE;
      const px = sample.pixels[activeIdx] ?? 0;
      setInternalX(parseFloat(px.toFixed(2)));
    }
  };

  // Select a pixel
  const handlePixelClick = (idx: number): void => {
    const val = activeSample.pixels[idx] ?? 0;
    const rounded = parseFloat(val.toFixed(2));
    if (propOnSelectPixel) {
      propOnSelectPixel(idx, rounded);
    } else {
      setInternalPixelIdx(idx);
      setInternalX(rounded);
    }
  };

  // Presets curated for learning
  const presets = useMemo(() => {
    return [
      {
        id: 'center',
        label: 'Center Stroke',
        idx: 210, // Row 10, Col 10
        desc: digitType === '1' ? 'Bright center stroke (x ≈ 0.99)' : 'Hollow center of digit 0 (x = 0.00)',
      },
      {
        id: 'edge',
        label: 'Soft Edge',
        idx: 74, // Row 3, Col 14
        desc: 'Anti-aliased transition edge (x ≈ 0.42)',
      },
      {
        id: 'bg',
        label: 'Background',
        idx: 0, // Row 0, Col 0
        desc: 'Empty dark background (x = 0.00)',
      },
    ];
  }, [digitType]);

  // Compute 5x5 neighborhood around the display pixel
  const loupeGrid = useMemo(() => {
    const cells: { r: number; c: number; idx: number; val: number; isCenter: boolean }[] = [];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = displayRow + dr;
        const c = displayCol + dc;
        if (r >= 0 && r < 20 && c >= 0 && c < 20) {
          const idx = r * 20 + c;
          cells.push({
            r,
            c,
            idx,
            val: activeSample.pixels[idx] ?? 0,
            isCenter: dr === 0 && dc === 0,
          });
        } else {
          cells.push({
            r,
            c,
            idx: -1,
            val: 0,
            isCenter: dr === 0 && dc === 0,
          });
        }
      }
    }
    return cells;
  }, [displayRow, displayCol, activeSample]);

  // Subtle text styling: quiet muted tone on empty zero pixels, high contrast on active stroke
  const getCellTextColor = (val: number, isCenter: boolean): string => {
    if (isCenter) {
      return val > 0.6 ? '#000000' : '#38bdf8';
    }
    if (val < 0.05) {
      return 'rgba(255, 255, 255, 0.22)';
    }
    if (val > 0.6) {
      return '#000000';
    }
    return '#ffffff';
  };

  return (
    <div className={`w-full rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 space-y-5 ${className}`}>
      {/* Top Header: Digit Sample Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent-light">
              <Crosshair className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-body font-bold text-text-primary">
              Interactive Pixel Inspector
            </h3>
          </div>
          <p className="text-caption text-text-muted mt-0.5">
            Click any square in the 20×20 image to choose pixel <span className="font-mono text-accent">x</span>.
          </p>
        </div>

        {/* Dataset Sample Toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-elevated/70 p-1 font-mono text-caption">
          <button
            type="button"
            onClick={() => handleSampleSwitch('0')}
            className={`rounded px-3 py-1.5 font-semibold transition-all cursor-pointer ${
              digitType === '0'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Digit 0 (y = 0)
          </button>
          <button
            type="button"
            onClick={() => handleSampleSwitch('1')}
            className={`rounded px-3 py-1.5 font-semibold transition-all cursor-pointer ${
              digitType === '1'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Digit 1 (y = 1)
          </button>
        </div>
      </div>

      {/* Stage 1 (Top / Centered): 20x20 Digit Canvas & Presets */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-1">
        <div className="relative rounded-xl border-2 border-border-strong bg-black p-3 shadow-2xl">
          {/* 20x20 SVG Image */}
          <svg
            viewBox="0 0 200 200"
            className="w-56 h-56 sm:w-64 sm:h-64 block select-none cursor-crosshair"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <filter id="pixel-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#38bdf8" />
              </filter>
            </defs>

            {/* Render 400 Pixel Rectangles */}
            {activeSample.pixels.map((val, idx) => {
              const col = idx % 20;
              const row = Math.floor(idx / 20);
              const isSelected = idx === activeIdx;
              const isHovered = idx === hoveredIdx;
              const intensity = Math.round(val * 255);

              return (
                <rect
                  key={idx}
                  x={col * 10}
                  y={row * 10}
                  width={10}
                  height={10}
                  fill={`rgb(${intensity},${intensity},${intensity})`}
                  stroke={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : '#18181b'}
                  strokeWidth={isSelected ? 1.6 : isHovered ? 1.0 : 0.25}
                  className="transition-colors"
                  onClick={() => handlePixelClick(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              );
            })}

            {/* Selected Pixel Reticle Box */}
            <rect
              x={activeCol * 10 - 1}
              y={activeRow * 10 - 1}
              width={12}
              height={12}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.8}
              rx={1}
              filter="url(#pixel-glow)"
              pointerEvents="none"
            />
          </svg>

          {/* Helper caption below image */}
          <div className="mt-2 text-center text-code-sm font-mono text-text-muted">
            20 × 20 Grayscale Grid (400 pixels)
          </div>
        </div>

        {/* Preset Buttons on one clean horizontal line */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-caption font-mono text-text-muted mr-1">Presets:</span>
          {presets.map((p) => {
            const isSelected = activeIdx === p.idx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePixelClick(p.idx)}
                className={`rounded-md px-3 py-1 text-code-sm font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'border border-accent bg-accent/20 text-accent-light font-bold shadow-sm'
                    : 'border border-border-subtle bg-elevated/70 text-text-secondary hover:text-text-primary hover:border-border-strong'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage 2 (Middle): Inspection Companion Cards (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-1">
        {/* Left Card: Selected Pixel Feature */}
        <div className="rounded-xl border border-border-subtle bg-base/80 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
            <span className="text-caption font-bold text-text-primary uppercase tracking-wide whitespace-nowrap">
              Selected Pixel
            </span>
            <span className="flex items-center gap-1 text-code-sm font-mono text-[#10b981] whitespace-nowrap shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active in Graph
            </span>
          </div>

          <div className="flex items-center gap-4 py-1">
            {/* Color Swatch Box */}
            <div
              className="h-16 w-16 shrink-0 rounded-lg border-2 border-border-strong shadow-inner flex items-center justify-center font-mono text-code font-bold"
              style={{
                backgroundColor: `rgb(${Math.round(currentX * 255)}, ${Math.round(currentX * 255)}, ${Math.round(currentX * 255)})`,
                color: currentX > 0.5 ? '#000000' : '#ffffff',
              }}
              title={`Grayscale value: ${currentX.toFixed(2)}`}
            >
              x
            </div>

            {/* Value Callouts */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-hero-sm font-extrabold font-mono text-accent">
                  x = {currentX.toFixed(2)}
                </span>
              </div>
              <div className="text-caption font-mono text-text-secondary">
                Position: Row {activeRow}, Col {activeCol} (Index #{activeIdx})
              </div>
              <div className="text-caption text-text-muted font-mono">
                Label: <span className="text-[#10b981] font-semibold">y = {currentTargetY}</span> ({digitType === '1' ? 'Digit 1' : 'Digit 0'})
              </div>
            </div>
          </div>

          <div className="text-code-sm text-text-muted font-mono pt-2 border-t border-border-subtle/60">
            Neuron Input: multiplied by weight w during forward pass.
          </div>
        </div>

        {/* Right Card: 5x5 Neighborhood Zoom Loupe */}
        <div className="rounded-xl border border-border-subtle bg-base/60 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
            <div className="flex items-center gap-1.5 font-bold text-text-primary text-caption uppercase tracking-wide whitespace-nowrap shrink-0">
              <ZoomIn className="h-3.5 w-3.5 text-accent" />
              <span>5×5 Neighborhood</span>
            </div>
            <div className="text-code-sm font-mono text-accent font-semibold whitespace-nowrap">
              ({displayRow}, {displayCol}) · x = {displayVal.toFixed(2)}
            </div>
          </div>

          {/* 5x5 Loupe Grid (Spacious, Crisp Pixels, Balanced Text Contrast) */}
          <div className="grid grid-cols-5 gap-1.5 max-w-[240px] sm:max-w-[260px] mx-auto p-2.5 rounded-xl bg-black/90 border border-border-subtle shadow-inner my-auto">
            {loupeGrid.map((cell, i) => {
              const intensity = Math.round(cell.val * 255);
              const isCenter = cell.isCenter;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (cell.idx >= 0) handlePixelClick(cell.idx);
                  }}
                  onMouseEnter={() => {
                    if (cell.idx >= 0) setHoveredIdx(cell.idx);
                  }}
                  className={`aspect-square rounded-[4px] flex items-center justify-center font-mono text-[10px] sm:text-[11px] font-medium cursor-pointer transition-all relative ${
                    isCenter
                      ? 'ring-2 ring-accent ring-offset-1 ring-offset-black shadow-md z-10 font-bold scale-105'
                      : 'border border-white/5 hover:border-accent/60 hover:scale-105 opacity-95 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `rgb(${intensity},${intensity},${intensity})`,
                    color: getCellTextColor(cell.val, isCenter),
                  }}
                  title={cell.idx >= 0 ? `Row ${cell.r}, Col ${cell.c}: ${cell.val.toFixed(2)}` : 'Canvas Border'}
                >
                  {cell.idx >= 0 ? (cell.val < 0.05 ? '0.0' : cell.val.toFixed(1)) : ''}
                </div>
              );
            })}
          </div>

          <p className="text-code-sm text-text-muted text-center pt-2 border-t border-border-subtle/60">
            5×5 sensor patch. Center tile highlights selected pixel.
          </p>
        </div>
      </div>

      {/* Stage 3 (Bottom): Real Algorithm Takeaway */}
      <div className="rounded-lg border border-accent/25 bg-accent/5 p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-caption font-semibold text-accent-light">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>How Real Algorithms Use This:</span>
        </div>
        <p className="text-body text-text-secondary leading-relaxed">
          Real models flatten the 20×20 image into a 400-number vector <span className="font-mono text-text-primary">x = [x₁, ..., x₄₀₀]</span>.
          All 400 pixels are processed in parallel with matrix math.
          We isolate this one pixel below so you can see each chain rule step clearly.
        </p>
      </div>
    </div>
  );
}
