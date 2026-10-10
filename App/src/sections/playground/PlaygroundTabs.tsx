import { useRef } from 'react';
import { Sliders, LineChart, Network, Layers } from 'lucide-react';
import type { HistoryPoint } from '../../store/playgroundStore';
import type {
  ActivationType,
  DatasetType,
  InitType,
  LayerWeightsSnapshot,
} from '../../lib/nn/types';
import type { NetworkNeuronsSnapshot } from '../../lib/neuronsAnalysis';
import { PlaygroundSettingsTab } from './PlaygroundSettingsTab';
import { PlaygroundChartsTab } from './PlaygroundChartsTab';
import { NetworkWeightsDiagram } from './NetworkWeightsDiagram';
import { PlaygroundNeuronsTab } from './PlaygroundNeuronsTab';

export type PlaygroundTabId = 'settings' | 'charts' | 'network' | 'neurons';

interface PlaygroundTabsProps {
  activeTab: PlaygroundTabId;
  onSelectTab: (tab: PlaygroundTabId) => void;

  // Settings tab props
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

  // Charts tab props
  history: HistoryPoint[];
  activeChart: 'loss' | 'accuracy';
  onSetActiveChart: (chart: 'loss' | 'accuracy') => void;

  // Network tab props
  weights: LayerWeightsSnapshot[];

  // Neurons tab props
  neuronsSnapshot: NetworkNeuronsSnapshot | null;
  selectedLayerIndex: number;
  onSelectLayerIndex: (index: number) => void;
}

export function PlaygroundTabs({
  activeTab,
  onSelectTab,
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
  history,
  activeChart,
  onSetActiveChart,
  weights,
  neuronsSnapshot,
  selectedLayerIndex,
  onSelectLayerIndex,
}: PlaygroundTabsProps): JSX.Element {
  const tabsList = [
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'charts', label: 'Charts', icon: LineChart },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'neurons', label: 'Neurons', icon: Layers },
  ] as const;

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % tabsList.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + tabsList.length) % tabsList.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabsList.length - 1;
    } else {
      return;
    }

    const nextTab = tabsList[nextIndex];
    if (nextTab) {
      onSelectTab(nextTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4 shadow-sm w-full">
      {/* Tab Switcher Headers */}
      <div
        role="tablist"
        aria-label="Playground tabs"
        className="grid grid-cols-4 p-1 bg-elevated/80 rounded-xl border border-border-subtle gap-1"
      >
        {tabsList.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-caption font-semibold rounded-lg transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
                isActive
                  ? 'bg-surface text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="mt-4">
        {/* Settings Tab Panel */}
        <div
          role="tabpanel"
          id="tabpanel-settings"
          aria-labelledby="tab-settings"
          hidden={activeTab !== 'settings'}
        >
          {activeTab === 'settings' && (
            <PlaygroundSettingsTab
              dataset={dataset}
              noise={noise}
              hiddenLayers={hiddenLayers}
              activation={activation}
              initType={initType}
              learningRate={learningRate}
              batchSize={batchSize}
              speed={speed}
              seed={seed}
              onSetDataset={onSetDataset}
              onSetNoise={onSetNoise}
              onSetHiddenLayersCount={onSetHiddenLayersCount}
              onSetNeuronCount={onSetNeuronCount}
              onSetActivation={onSetActivation}
              onSetInitType={onSetInitType}
              onSetLearningRate={onSetLearningRate}
              onSetBatchSize={onSetBatchSize}
              onSetSpeed={onSetSpeed}
              onRandomizeSeed={onRandomizeSeed}
            />
          )}
        </div>

        {/* Charts Tab Panel */}
        <div
          role="tabpanel"
          id="tabpanel-charts"
          aria-labelledby="tab-charts"
          hidden={activeTab !== 'charts'}
        >
          {activeTab === 'charts' && (
            <PlaygroundChartsTab
              history={history}
              activeChart={activeChart}
              onSetActiveChart={onSetActiveChart}
            />
          )}
        </div>

        {/* Network Tab Panel */}
        <div
          role="tabpanel"
          id="tabpanel-network"
          aria-labelledby="tab-network"
          hidden={activeTab !== 'network'}
        >
          {activeTab === 'network' && (
            <NetworkWeightsDiagram
              weights={weights}
              hiddenLayers={hiddenLayers}
            />
          )}
        </div>

        {/* Neurons Tab Panel */}
        <div
          role="tabpanel"
          id="tabpanel-neurons"
          aria-labelledby="tab-neurons"
          hidden={activeTab !== 'neurons'}
        >
          {activeTab === 'neurons' && (
            <PlaygroundNeuronsTab
              neuronsSnapshot={neuronsSnapshot}
              selectedLayerIndex={selectedLayerIndex}
              onSelectLayerIndex={onSelectLayerIndex}
              hiddenLayers={hiddenLayers}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaygroundTabs;
