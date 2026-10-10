import {
  Mafs,
  Coordinates,
  Plot,
  MovablePoint,
  Point,
  Line,
} from 'mafs';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Stat } from '@/components/ui/Stat';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { ACTIVATIONS, type ActivationInfo } from '@/lib/activations';

export interface ActivationPlotProps {
  selectedId: 'sigmoid' | 'tanh' | 'relu' | 'leaky-relu';
  currentZ: number;
  overlayAll: boolean;
  onSelectId: (id: 'sigmoid' | 'tanh' | 'relu' | 'leaky-relu') => void;
  onDragZ: (z: number) => void;
  onToggleOverlay: (v: boolean) => void;
}

export function ActivationPlot({
  selectedId,
  currentZ,
  overlayAll,
  onSelectId,
  onDragZ,
  onToggleOverlay,
}: ActivationPlotProps): JSX.Element {
  const activeInfo: ActivationInfo = ACTIVATIONS[selectedId];

  const zClamped = Math.max(-4.5, Math.min(4.5, currentZ));
  const valF = activeInfo.fn(zClamped);
  const valDf = activeInfo.dfn(zClamped);

  return (
    <div className="w-full space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <SegmentedControl
          options={[
            { value: 'sigmoid', label: 'Sigmoid' },
            { value: 'tanh', label: 'Tanh' },
            { value: 'relu', label: 'ReLU' },
            { value: 'leaky-relu', label: 'Leaky ReLU' },
          ]}
          value={selectedId}
          onChange={onSelectId}
          size="sm"
        />

        <Toggle
          label="Overlay All Curves"
          checked={overlayAll}
          onChange={onToggleOverlay}
        />
      </div>

      {/* Mafs Function & Derivative Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <Mafs
          width="auto"
          height={340}
          viewBox={{ x: [-4.2, 4.2], y: [-1.4, 3.2] }}
          pan={false}
          zoom={false}
        >
          <Coordinates.Cartesian
            subdivisions={2}
            xAxis={{ lines: 1, labels: (x) => `${x}` }}
            yAxis={{ lines: 1, labels: (y) => `${y}` }}
          />

          {/* Optional Overlay of All Curves */}
          {overlayAll && (
            <>
              {selectedId !== 'sigmoid' && (
                <Plot.OfX y={ACTIVATIONS.sigmoid.fn} color="#3b82f6" weight={1.5} opacity={0.35} />
              )}
              {selectedId !== 'tanh' && (
                <Plot.OfX y={ACTIVATIONS.tanh.fn} color="#10b981" weight={1.5} opacity={0.35} />
              )}
              {selectedId !== 'relu' && (
                <Plot.OfX y={ACTIVATIONS.relu.fn} color="#f59e0b" weight={1.5} opacity={0.35} />
              )}
              {selectedId !== 'leaky-relu' && (
                <Plot.OfX y={ACTIVATIONS['leaky-relu'].fn} color="#8b5cf6" weight={1.5} opacity={0.35} />
              )}
            </>
          )}

          {/* Primary Function Curve f(z) */}
          <Plot.OfX
            y={activeInfo.fn}
            color="var(--color-accent)"
            weight={3}
          />

          {/* Derivative Curve f'(z) */}
          <Plot.OfX
            y={activeInfo.dfn}
            color="#f59e0b"
            weight={2.5}
            style="dashed"
          />

          {/* Vertical Guide Line Linking f(z) and f'(z) at current z */}
          <Line.Segment
            point1={[zClamped, valF]}
            point2={[zClamped, valDf]}
            color="#71717a"
            style="dashed"
            weight={1}
          />

          {/* Derivative Marker Dot */}
          <Point
            x={zClamped}
            y={valDf}
            color="#f59e0b"
            svgCircleProps={{ r: 4 }}
          />

          {/* Interactive Draggable Point on f(z) */}
          <MovablePoint
            point={[zClamped, valF]}
            onMove={([newZ]) => onDragZ(parseFloat(newZ.toFixed(2)))}
            constrain={([z]) => {
              const clamped = Math.max(-4.0, Math.min(4.0, z));
              return [clamped, activeInfo.fn(clamped)];
            }}
            color="#60a5fa"
          />
        </Mafs>

        {/* Legend Overlay */}
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1.5 rounded-md border border-border-subtle bg-surface/85 p-2 text-caption backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-accent" />
            <span className="text-text-muted">Function f(z)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-[#f59e0b]" />
            <span className="text-text-muted">Derivative f'(z)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-light" />
            <span className="text-text-muted">Drag input z</span>
          </div>
        </div>
      </div>

      {/* Input Slider */}
      <Slider
        label="Input Coordinate (z)"
        min={-4}
        max={4}
        step={0.1}
        value={currentZ}
        onChange={(v) => onDragZ(parseFloat(v.toFixed(1)))}
      />

      {/* Live Numeric Readouts */}
      <ControlsGrid columns={4}>
        <Stat
          label="Input z"
          value={zClamped.toFixed(2)}
          variant="default"
          subtext="Neuron sum w·x+b"
        />
        <Stat
          label="Output f(z)"
          value={valF.toFixed(3)}
          variant="accent"
          subtext={`Range: ${activeInfo.range}`}
        />
        <Stat
          label="Slope f'(z)"
          value={valDf.toFixed(3)}
          variant="warning"
          subtext="Local derivative"
        />
        <Stat
          label="Max Slope"
          value={activeInfo.maxDerivative.toFixed(2)}
          variant="success"
          subtext={selectedId === 'sigmoid' ? 'Max 0.25 (Vanishing)' : 'Maintains signal'}
        />
      </ControlsGrid>

      {/* Vanishing Gradient Diagnostic Alert */}
      <div className="rounded-lg border border-border-subtle bg-elevated/70 p-3.5 text-caption text-text-secondary leading-relaxed">
        <strong className="text-text-primary">{activeInfo.name} Gradient Dynamics: </strong>
        {activeInfo.gradientRisk}
      </div>
    </div>
  );
}
