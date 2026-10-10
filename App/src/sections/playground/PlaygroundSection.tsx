import { useRef, useEffect, useState } from 'react';
import { usePlaygroundStore } from '../../store/playgroundStore';
import { usePlaygroundWorker } from '../../hooks/usePlaygroundWorker';
import { useElementSize } from '../../hooks/useElementSize';
import { PlaygroundPresetsStrip } from './PlaygroundPresetsStrip';
import { DecisionBoundaryCanvas } from './DecisionBoundaryCanvas';
import { PlaygroundRunBar } from './PlaygroundRunBar';
import { PlaygroundMetrics } from './PlaygroundMetrics';
import { PlaygroundTabs } from './PlaygroundTabs';

export function PlaygroundSection(): JSX.Element {
  const {
    dataset,
    noise,
    hiddenLayers,
    activation,
    initType,
    learningRate,
    batchSize,
    speed,
    seed,
    isTraining,
    addPointsMode,
    activeTab,
    activeChart,
    epoch,
    loss,
    accuracy,
    history,
    points,
    weights,
    grid,
    neuronsSnapshot,
    selectedNeuronLayerIndex,
    setSelectedNeuronLayerIndex,
    setDataset,
    setNoise,
    setHiddenLayersCount,
    setNeuronCount,
    setActivation,
    setInitType,
    setLearningRate,
    setBatchSize,
    setSpeed,
    setAddPointsMode,
    setActiveTab,
    setActiveChart,
  } = usePlaygroundStore();

  const {
    start,
    pause,
    step,
    reset,
    randomizeSeed,
    addPoint,
    applyPreset,
    resetToDefaults,
  } = usePlaygroundWorker();

  // Measure root container width directly for responsive layout switching
  const { ref: rootRef, width: rootWidth } = useElementSize<HTMLDivElement>();

  // Track if stage is visible in viewport for mobile sticky run bar
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isStageInView, setIsStageInView] = useState<boolean>(true);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStageInView(entry?.isIntersecting ?? true);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isWide = rootWidth >= 960;
  const isMobile = rootWidth > 0 && rootWidth < 640;

  return (
    <div
      ref={rootRef}
        className={`flex flex-col gap-6 w-full max-w-7xl mx-auto ${
          isMobile ? 'pb-20' : ''
        }`}
      >
        {/* 1. Header Intro (Simple language, 1-2 short sentences) */}
        <p className="text-body text-text-secondary leading-relaxed max-w-3xl">
          Train a real neural network directly in your browser. Pick a dataset,
          choose your layers, and watch the model find a decision boundary in real
          time.
        </p>

        {/* 2. Presets Strip */}
        <PlaygroundPresetsStrip
          onApplyPreset={applyPreset}
          onResetToDefaults={resetToDefaults}
        />

        {/* 3. Main Workspace: Wide (2 columns) vs Narrow (1 column) */}
        <div
          className={
            isWide
              ? 'grid grid-cols-12 gap-6 items-start'
              : 'flex flex-col gap-6'
          }
        >
          {/* THE STAGE (Canvas, Run Bar, Metrics) */}
          <div
            ref={stageRef}
            className={`flex flex-col gap-4 ${
              isWide ? 'col-span-7' : 'w-full'
            }`}
          >
            {/* Decision boundary canvas */}
            <DecisionBoundaryCanvas
              grid={grid}
              points={points}
              datasetName={dataset}
              addPointsMode={addPointsMode}
              onSetAddPointsMode={setAddPointsMode}
              onAddPoint={addPoint}
            />

            {/* In-flow Run Bar */}
            <div className={isMobile && isStageInView ? 'opacity-0 pointer-events-none' : ''}>
              <PlaygroundRunBar
                isTraining={isTraining}
                containerWidth={rootWidth}
                onStart={start}
                onPause={pause}
                onStep={step}
                onReset={reset}
                onRandomizeSeed={randomizeSeed}
              />
            </div>

            {/* Metrics Strip + What is happening line */}
            <PlaygroundMetrics
              epoch={epoch}
              loss={loss}
              accuracy={accuracy}
              pointsCount={points.length}
              isTraining={isTraining}
              history={history}
              containerWidth={rootWidth}
            />
          </div>

          {/* SETTINGS AND INSIGHTS PANEL (TABS) */}
          <div
            className={`${
              isWide ? 'col-span-5 sticky top-6' : 'w-full'
            }`}
          >
            <PlaygroundTabs
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              dataset={dataset}
              noise={noise}
              hiddenLayers={hiddenLayers}
              activation={activation}
              initType={initType}
              learningRate={learningRate}
              batchSize={batchSize}
              speed={speed}
              seed={seed}
              onSetDataset={setDataset}
              onSetNoise={setNoise}
              onSetHiddenLayersCount={setHiddenLayersCount}
              onSetNeuronCount={setNeuronCount}
              onSetActivation={setActivation}
              onSetInitType={setInitType}
              onSetLearningRate={setLearningRate}
              onSetBatchSize={setBatchSize}
              onSetSpeed={setSpeed}
              onRandomizeSeed={randomizeSeed}
              history={history}
              activeChart={activeChart}
              onSetActiveChart={setActiveChart}
              weights={weights}
              neuronsSnapshot={neuronsSnapshot}
              selectedLayerIndex={selectedNeuronLayerIndex}
              onSelectLayerIndex={setSelectedNeuronLayerIndex}
            />
          </div>
        </div>

        {/* Mobile Sticky Bottom Run Bar (When root < 640px and Stage is on screen) */}
        {isMobile && isStageInView && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="max-w-md mx-auto">
              <PlaygroundRunBar
                isTraining={isTraining}
                containerWidth={rootWidth}
                onStart={start}
                onPause={pause}
                onStep={step}
                onReset={reset}
                onRandomizeSeed={randomizeSeed}
              />
            </div>
          </div>
        )}
      </div>
  );
}
