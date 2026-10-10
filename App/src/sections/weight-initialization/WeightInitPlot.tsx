import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  simulateLayerDistributions,
  type WeightInitMode,
} from '@/lib/weightInitAnalysis';
import { Slider } from '@/components/ui/Slider';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function WeightInitPlot(): JSX.Element {
  const [mode, setMode] = useState<WeightInitMode>('xavier');
  const [depth, setDepth] = useState<number>(6);
  const [activation, setActivation] = useState<'tanh' | 'relu'>('tanh');
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(1);

  const simulation = useMemo(() => {
    return simulateLayerDistributions(depth, mode, activation);
  }, [depth, mode, activation]);

  // Clamp selected layer index if depth changed
  const safeLayerIndex = Math.min(selectedLayerIndex, depth);
  const activeLayer =
    simulation.layers.find((l) => l.layerIndex === safeLayerIndex) ??
    simulation.layers[0]!;

  const stdTrends = useMemo(() => {
    return simulation.layers.map((l) => ({
      name: `L${l.layerIndex}`,
      std: l.std,
      mean: l.mean,
    }));
  }, [simulation]);

  const modeOptions: Array<{ id: WeightInitMode; label: string; desc: string }> = [
    { id: 'zeros', label: 'Zeros', desc: 'All weights = 0' },
    { id: 'small', label: 'Small (0.01)', desc: 'Standard dev = 0.01' },
    { id: 'large', label: 'Large (1.0)', desc: 'Standard dev = 1.0' },
    { id: 'xavier', label: 'Xavier', desc: 'Best for tanh' },
    { id: 'he', label: 'He', desc: 'Best for ReLU' },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 w-full">
      {/* Top Controls: Mode & Activation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Initialization mode">
          {modeOptions.map((opt) => {
            const isSelected = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={`px-2.5 py-1.5 text-caption font-semibold rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent/15 border-accent text-accent-light shadow-xs'
                    : 'bg-elevated/60 border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Activation Toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border-subtle bg-elevated/70">
          <button
            type="button"
            onClick={() => setActivation('tanh')}
            className={`px-2.5 py-1 text-caption font-semibold rounded-md transition-colors cursor-pointer ${
              activation === 'tanh'
                ? 'bg-surface text-text-primary shadow-xs'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            tanh
          </button>
          <button
            type="button"
            onClick={() => setActivation('relu')}
            className={`px-2.5 py-1 text-caption font-semibold rounded-md transition-colors cursor-pointer ${
              activation === 'relu'
                ? 'bg-surface text-text-primary shadow-xs'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            ReLU
          </button>
        </div>
      </div>

      {/* Slider for Depth */}
      <div className="py-1">
        <Slider
          label="Network Depth"
          value={depth}
          min={3}
          max={10}
          step={1}
          onChange={setDepth}
          formatValue={(v) => `${v} layers`}
        />
      </div>

      {/* Status Alert Banner */}
      <div
        className={`flex items-center gap-2 p-3 rounded-lg border text-caption ${
          simulation.overallStatus === 'healthy'
            ? 'bg-success/10 border-success/30 text-success'
            : simulation.overallStatus === 'symmetric'
            ? 'bg-warning/10 border-warning/30 text-warning'
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}
      >
        {simulation.overallStatus === 'healthy' ? (
          <CheckCircle className="w-4 h-4 shrink-0" />
        ) : simulation.overallStatus === 'symmetric' ? (
          <Info className="w-4 h-4 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        )}
        <span className="font-medium">{simulation.statusMessage}</span>
      </div>

      {/* Charts Dual Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Standard Deviation across Layers */}
        <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-elevated/30 p-3 sm:p-4">
          <div className="flex items-center justify-between text-caption px-1">
            <span className="font-semibold text-text-primary">
              Signal Spread Per Layer
            </span>
            <span className="text-text-muted font-mono text-[11px]">
              Std Dev (Target ~0.5 - 1.0)
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stdTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121215',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="std"
                  stroke={
                    simulation.overallStatus === 'healthy'
                      ? '#3b82f6'
                      : simulation.overallStatus === 'symmetric'
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#f8fafc' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inspected Layer Activation Histogram */}
        <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-elevated/30 p-3 sm:p-4">
          <div className="flex items-center justify-between text-caption px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-text-primary">
                Histogram: Layer {safeLayerIndex}
              </span>
              <span className="text-text-muted font-mono text-[11px]">
                (Std: {activeLayer.std.toFixed(3)})
              </span>
            </div>

            {/* Layer picker pills */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[180px]">
              {simulation.layers.map((l) => (
                <button
                  key={l.layerIndex}
                  type="button"
                  onClick={() => setSelectedLayerIndex(l.layerIndex)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                    safeLayerIndex === l.layerIndex
                      ? 'bg-accent text-white font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  L{l.layerIndex}
                </button>
              ))}
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeLayer.histogram} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="bin" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121215',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {activeLayer.histogram.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        simulation.overallStatus === 'healthy'
                          ? '#3b82f6'
                          : simulation.overallStatus === 'symmetric'
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeightInitPlot;
