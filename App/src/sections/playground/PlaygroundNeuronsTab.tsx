import { useRef, useEffect, useState, useId } from 'react';
import type {
  NetworkNeuronsSnapshot,
  NeuronGridData,
} from '../../lib/neuronsAnalysis';
import { AlertCircle, Layers } from 'lucide-react';

interface PlaygroundNeuronsTabProps {
  neuronsSnapshot: NetworkNeuronsSnapshot | null;
  selectedLayerIndex: number;
  onSelectLayerIndex: (index: number) => void;
  hiddenLayers: number[];
}

interface NeuronCanvasProps {
  neuron: NeuronGridData;
  resolution: number;
}

function NeuronCanvas({ neuron, resolution }: NeuronCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== resolution || canvas.height !== resolution) {
      canvas.width = resolution;
      canvas.height = resolution;
    }

    const imgData = ctx.createImageData(resolution, resolution);
    const data = imgData.data;
    const values = neuron.values;
    const min = neuron.min;
    const max = neuron.max;
    const span = Math.max(1e-6, max - min);

    const totalCells = resolution * resolution;
    for (let i = 0; i < totalCells; i++) {
      const val = values[i] ?? 0;
      const t = (val - min) / span; // 0 to 1

      let r = 18;
      let g = 18;
      let b = 21;

      if (t > 0.5) {
        // Dark to Accent Blue (#3b82f6 -> rgb(59, 130, 246))
        const k = (t - 0.5) / 0.5;
        r = Math.round(18 + k * 41);
        g = Math.round(18 + k * 112);
        b = Math.round(21 + k * 225);
      } else {
        // Amber Contrast to Dark (#f59e0b -> rgb(245, 158, 11))
        const k = (0.5 - t) / 0.5;
        r = Math.round(18 + k * 227);
        g = Math.round(18 + k * 140);
        b = Math.round(21 - k * 10);
      }

      const offset = i * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [neuron, resolution]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block rounded-md"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function PlaygroundNeuronsTab({
  neuronsSnapshot,
  selectedLayerIndex,
  onSelectLayerIndex,
  hiddenLayers,
}: PlaygroundNeuronsTabProps): JSX.Element {
  const [inspectedNeuron, setInspectedNeuron] = useState<NeuronGridData | null>(null);
  const tooltipId = useId();

  const totalHiddenLayers = hiddenLayers.length;
  const layers = neuronsSnapshot?.layers ?? [];

  // Safe layer selection
  const safeLayerIndex = Math.min(
    Math.max(0, selectedLayerIndex),
    Math.max(0, layers.length - 1)
  );
  const activeLayer = layers[safeLayerIndex];
  const resolution = neuronsSnapshot?.resolution ?? 24;

  const handleInspect = (neuron: NeuronGridData) => {
    setInspectedNeuron(neuron);
  };

  const handleClearInspect = () => {
    setInspectedNeuron(null);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Header with Layer Selectors and Palette Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        {totalHiddenLayers > 0 ? (
          <div
            role="tablist"
            aria-label="Select hidden layer to inspect"
            className="flex items-center gap-1 p-0.5 bg-elevated/70 rounded-lg border border-border-subtle"
          >
            {hiddenLayers.map((count, idx) => {
              const isSelected = safeLayerIndex === idx;
              return (
                <button
                  key={`layer-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectLayerIndex(idx)}
                  className={`px-2.5 py-1 text-caption font-semibold rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-surface text-text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Layer {idx + 1} ({count})
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-caption text-text-secondary font-medium">
            Linear Model (No hidden layers)
          </span>
        )}

        {/* Diverging Palette Legend */}
        <div className="flex items-center gap-2 text-caption text-text-muted shrink-0">
          <span className="text-[11px] font-medium">Low</span>
          <div
            aria-hidden="true"
            className="h-2 w-20 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#121215] to-[#3b82f6] border border-border-subtle"
          />
          <span className="text-[11px] font-medium">High</span>
        </div>
      </div>

      {/* Tooltip & Inspection Readout Banner */}
      <div
        id={tooltipId}
        aria-live="polite"
        className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-elevated/40 text-caption flex items-center justify-between min-h-[34px]"
      >
        {inspectedNeuron ? (
          <span className="text-text-primary font-medium">
            {inspectedNeuron.label}: outputs between{' '}
            <span className="font-mono text-warning">
              {inspectedNeuron.min.toFixed(1)}
            </span>{' '}
            and{' '}
            <span className="font-mono text-accent">
              {inspectedNeuron.max.toFixed(1)}
            </span>
          </span>
        ) : (
          <span className="text-text-muted">
            Hover, focus, or tap a square to see its output range.
          </span>
        )}
      </div>

      {/* Identical Neurons Symmetry Warning */}
      {activeLayer?.allIdentical && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-caption">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            These neurons all look the same, so they cannot learn different things. This is why zero initialization fails.
          </span>
        </div>
      )}

      {/* Reserved Height Grid Container */}
      <div className="min-h-[220px] rounded-xl border border-border-subtle bg-elevated/20 p-3 sm:p-4">
        {totalHiddenLayers === 0 && neuronsSnapshot?.outputNeuron ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <span className="text-caption text-text-muted">Output Probability Map:</span>
            <div
              tabIndex={0}
              role="button"
              aria-label="Output neuron response map"
              onMouseEnter={() => handleInspect(neuronsSnapshot.outputNeuron)}
              onMouseLeave={handleClearInspect}
              onFocus={() => handleInspect(neuronsSnapshot.outputNeuron)}
              onBlur={handleClearInspect}
              onClick={() => handleInspect(neuronsSnapshot.outputNeuron)}
              className="w-24 h-24 aspect-square rounded-lg border border-border-subtle bg-surface p-1 relative focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer group"
            >
              <NeuronCanvas neuron={neuronsSnapshot.outputNeuron} resolution={resolution} />
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/75 text-white/90">
                Output
              </div>
            </div>
          </div>
        ) : activeLayer && activeLayer.neurons.length > 0 ? (
          <div
            className="grid gap-2.5 sm:gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            }}
          >
            {activeLayer.neurons.map((neuron) => (
              <div
                key={`neuron-${activeLayer.layerIndex}-${neuron.neuronIndex}`}
                tabIndex={0}
                role="button"
                aria-label={`${neuron.label} heatmap: outputs between ${neuron.min.toFixed(1)} and ${neuron.max.toFixed(1)}`}
                onMouseEnter={() => handleInspect(neuron)}
                onMouseLeave={handleClearInspect}
                onFocus={() => handleInspect(neuron)}
                onBlur={handleClearInspect}
                onClick={() => handleInspect(neuron)}
                className="aspect-square rounded-lg border border-border-subtle bg-surface p-1 relative focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <NeuronCanvas neuron={neuron} resolution={resolution} />
                <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/75 text-white/90 pointer-events-none">
                  {neuron.label}
                </div>
              </div>
            ))}

            {/* Optional Output Neuron Square */}
            {neuronsSnapshot?.outputNeuron && (
              <div
                tabIndex={0}
                role="button"
                aria-label="Final output neuron heatmap"
                onMouseEnter={() => handleInspect(neuronsSnapshot.outputNeuron)}
                onMouseLeave={handleClearInspect}
                onFocus={() => handleInspect(neuronsSnapshot.outputNeuron)}
                onBlur={handleClearInspect}
                onClick={() => handleInspect(neuronsSnapshot.outputNeuron)}
                className="aspect-square rounded-lg border border-border-accent/60 bg-surface p-1 relative focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <NeuronCanvas neuron={neuronsSnapshot.outputNeuron} resolution={resolution} />
                <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded text-[10px] font-mono font-semibold bg-accentDark/85 text-white pointer-events-none">
                  Output
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center gap-2 text-caption text-text-muted">
            <Layers className="w-5 h-5 opacity-60" />
            <span>Evaluating neuron heatmaps...</span>
          </div>
        )}
      </div>

      {/* Caption Explanation */}
      <div className="text-caption text-text-muted px-1">
        Each square shows what one neuron responds to. At the start, many look alike. As training goes on, they become different, and together they draw the final boundary.
      </div>
    </div>
  );
}

export default PlaygroundNeuronsTab;
