import { useState } from 'react';
import {
  Moon,
  Circle,
  Grid2x2,
  CircleDot,
  RotateCw,
  Info,
  ChevronDown,
  ChevronRight,
  Dices,
} from 'lucide-react';
import type {
  ActivationType,
  DatasetType,
  InitType,
} from '../../lib/nn/types';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Tooltip } from '../../components/ui/Tooltip';

interface PlaygroundSettingsTabProps {
  dataset: DatasetType;
  noise: number;
  hiddenLayers: number[];
  activation: ActivationType;
  initType: InitType;
  learningRate: number;
  batchSize: number;
  speed: number;
  seed: number;

  onSetDataset: (ds: DatasetType) => void;
  onSetNoise: (noise: number) => void;
  onSetHiddenLayersCount: (count: number) => void;
  onSetNeuronCount: (layerIdx: number, count: number) => void;
  onSetActivation: (act: ActivationType) => void;
  onSetInitType: (init: InitType) => void;
  onSetLearningRate: (lr: number) => void;
  onSetBatchSize: (bs: number) => void;
  onSetSpeed: (speed: number) => void;
  onRandomizeSeed: () => void;
}

export function PlaygroundSettingsTab({
  dataset,
  noise,
  hiddenLayers,
  activation,
  initType,
  learningRate,
  batchSize,
  speed,
  seed,
  onSetDataset,
  onSetNoise,
  onSetHiddenLayersCount,
  onSetNeuronCount,
  onSetActivation,
  onSetInitType,
  onSetLearningRate,
  onSetBatchSize,
  onSetSpeed,
  onRandomizeSeed,
}: PlaygroundSettingsTabProps): JSX.Element {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  const datasetOptions = [
    { id: 'moons', label: 'Moons', icon: Moon },
    { id: 'circles', label: 'Circles', icon: Circle },
    { id: 'xor', label: 'XOR', icon: Grid2x2 },
    { id: 'blobs', label: 'Blobs', icon: CircleDot },
    { id: 'spiral', label: 'Spiral', icon: RotateCw },
  ] as const;

  return (
    <div className="flex flex-col gap-4 text-text-primary">
      {/* 1. DATA GROUP */}
      <div className="flex flex-col gap-3">
        <div className="text-label text-accent font-semibold">1. Data</div>

        {/* Dataset chips with icons */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-text-secondary font-medium">
            Dataset
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {datasetOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = dataset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSetDataset(opt.id)}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-caption font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-surface hover:bg-hover border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Noise Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-caption">
            <span className="text-text-secondary font-medium">Noise</span>
            <span className="text-code-sm font-semibold text-accent tabular-nums">
              {(noise * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.02}
            value={noise}
            onChange={(e) => onSetNoise(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-elevated appearance-none accent-accent cursor-pointer"
          />
        </div>
      </div>

      <hr className="border-border-subtle" />

      {/* 2. MODEL GROUP */}
      <div className="flex flex-col gap-3">
        <div className="text-label text-accent font-semibold">2. Model</div>

        {/* Hidden Layers Segmented Control */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-text-secondary font-medium">
            Hidden Layers
          </span>
          <SegmentedControl<'1' | '2' | '3'>
            size="sm"
            options={[
              { value: '1', label: '1 Layer' },
              { value: '2', label: '2 Layers' },
              { value: '3', label: '3 Layers' },
            ]}
            value={String(Math.max(1, Math.min(3, hiddenLayers.length))) as '1' | '2' | '3'}
            onChange={(val) => onSetHiddenLayersCount(parseInt(val, 10))}
          />
        </div>

        {/* Neurons per EXISTING layer ONLY */}
        <div className="flex flex-col gap-2">
          {hiddenLayers.map((neurons, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-caption">
                <span className="text-text-secondary font-medium">
                  Layer {idx + 1} Neurons
                </span>
                <span className="text-code-sm font-semibold text-accent tabular-nums">
                  {neurons}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={16}
                step={1}
                value={neurons}
                onChange={(e) =>
                  onSetNeuronCount(idx, parseInt(e.target.value, 10))
                }
                className="w-full h-1.5 rounded-lg bg-elevated appearance-none accent-accent cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* Activation & Initialization Selects */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-caption text-text-secondary font-medium">
              Activation
            </label>
            <select
              value={activation}
              onChange={(e) => onSetActivation(e.target.value as ActivationType)}
              className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-caption text-text-primary focus:border-accent cursor-pointer"
            >
              <option value="tanh">Tanh</option>
              <option value="relu">ReLU</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="linear">Linear</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <label className="text-caption text-text-secondary font-medium">
                Initialization
              </label>
              <Tooltip content="Zeros locks hidden weights together. Xavier and He scale starting weights for fast learning.">
                <button
                  type="button"
                  aria-label="Initialization details"
                  className="text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
            <select
              value={initType}
              onChange={(e) => onSetInitType(e.target.value as InitType)}
              className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-caption text-text-primary focus:border-accent cursor-pointer"
            >
              <option value="xavier">Xavier (Glorot)</option>
              <option value="he">He</option>
              <option value="random">Random</option>
              <option value="zeros">Zeros</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-border-subtle" />

      {/* 3. TRAINING GROUP */}
      <div className="flex flex-col gap-3">
        <div className="text-label text-accent font-semibold">3. Training</div>

        {/* Learning Rate Slider & 3 Quick Buttons */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-caption">
            <span className="text-text-secondary font-medium">Learning Rate</span>
            <span className="text-code-sm font-semibold text-accent tabular-nums">
              {learningRate.toFixed(2)}
            </span>
          </div>

          <input
            type="range"
            min={0.01}
            max={1.0}
            step={0.01}
            value={Math.min(1.0, learningRate)}
            onChange={(e) => onSetLearningRate(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-elevated appearance-none accent-accent cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-code-sm text-text-muted">Quick:</span>
            {[0.01, 0.1, 1.0].map((quickLr) => (
              <button
                key={quickLr}
                type="button"
                onClick={() => onSetLearningRate(quickLr)}
                className={`px-2 py-0.5 rounded text-code-sm border transition-colors cursor-pointer ${
                  Math.abs(learningRate - quickLr) < 0.005
                    ? 'bg-accent text-white border-accent font-semibold'
                    : 'bg-surface hover:bg-hover border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                {quickLr}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Accordion (Closed by default) */}
        <div className="border border-border-subtle rounded-lg overflow-hidden bg-surface/50">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            className="w-full px-3 py-2 flex items-center justify-between text-caption font-medium text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
          >
            <span>Advanced Training Settings</span>
            {isAdvancedOpen ? (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-muted" />
            )}
          </button>

          {isAdvancedOpen && (
            <div className="p-3 border-t border-border-subtle flex flex-col gap-3 bg-surface">
              {/* Batch Size */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-text-secondary font-medium">
                    Batch Size
                  </span>
                  <span className="text-code-sm font-semibold text-accent tabular-nums">
                    {batchSize}
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={64}
                  step={4}
                  value={batchSize}
                  onChange={(e) => onSetBatchSize(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded-lg bg-elevated appearance-none accent-accent cursor-pointer"
                />
              </div>

              {/* Speed */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-text-secondary font-medium">
                    Speed (Epochs / Sec)
                  </span>
                  <span className="text-code-sm font-semibold text-accent tabular-nums">
                    {speed}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={speed}
                  onChange={(e) => onSetSpeed(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded-lg bg-elevated appearance-none accent-accent cursor-pointer"
                />
              </div>

              {/* Seed */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-caption text-text-secondary">
                  <span>Random Seed:</span>
                  <span className="text-code-sm font-semibold text-text-primary tabular-nums">
                    {seed}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRandomizeSeed}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-caption font-medium bg-elevated hover:bg-hover text-text-primary border border-border-subtle cursor-pointer transition-colors"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>New Seed</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
