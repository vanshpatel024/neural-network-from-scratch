import {
  BookOpen,
  Cpu,
  Activity,
  ArrowRightCircle,
  Target,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  PlayCircle,
} from 'lucide-react';
import type { SectionItem } from './types';
import { IntroductionSection } from './IntroductionSection';
import { NeuronSection } from './NeuronSection';
import { ActivationFunctionsSection } from './ActivationFunctionsSection';
import { ForwardPropagationSection } from './ForwardPropagationSection';
import { LossFunctionsSection } from './LossFunctionsSection';
import { GradientDescentSection } from './GradientDescentSection';
import { BackpropagationSection } from './BackpropagationSection';
import { WeightInitializationSection } from './WeightInitializationSection';
import { MiniBatchSgdSection } from './MiniBatchSgdSection';
import { GradientCheckingSection } from './GradientCheckingSection';
import { lazy, Suspense } from 'react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';

const LazyPlaygroundSection = lazy(() =>
  import('./playground/PlaygroundSection').then((m) => ({
    default: m.PlaygroundSection,
  }))
);

function TrainModelSection(): JSX.Element {
  return (
    <SectionWrapper
      id="train-your-own-model"
      title="Train Your Own Model"
      eyebrow="Interactive Playground"
    >
      <Suspense
        fallback={
          <div className="h-96 rounded-2xl bg-surface/50 border border-border-subtle flex flex-col items-center justify-center p-8 gap-3 text-text-muted text-caption text-center max-w-lg mx-auto">
            <span className="font-medium text-text">Loading the interactive model playground.</span>
            <span>
              Here you can train your neural network on simple 2D datasets.
              You can adjust the learning rate, change batch size, and choose an activation function.
              Watch the loss go down on the chart as the model learns each epoch.
              Click a point on the canvas to add data or inspect hidden units.
            </span>
          </div>
        }
      >
        <LazyPlaygroundSection />
      </Suspense>
    </SectionWrapper>
  );
}

export type { SectionItem, SectionGroup, SubsectionItem } from './types';
export {
  IntroductionSection,
  NeuronSection,
  ActivationFunctionsSection,
  ForwardPropagationSection,
  LossFunctionsSection,
  GradientDescentSection,
  BackpropagationSection,
  WeightInitializationSection,
  MiniBatchSgdSection,
  GradientCheckingSection,
  TrainModelSection,
};

export const SECTIONS: readonly SectionItem[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    group: 'Foundations',
    icon: BookOpen,
    component: IntroductionSection,
    subsections: [
      { id: 'introduction--project-goal', title: '1. Project Goal' },
      { id: 'introduction--interactive-tools', title: '2. Interactive Tools' },
      { id: 'introduction--code-to-math', title: '3. Code to Math' },
      { id: 'introduction--learning-roadmap', title: '4. Learning Roadmap' },
    ],
  },
  {
    id: 'the-neuron',
    title: 'The Neuron',
    group: 'Foundations',
    icon: Cpu,
    component: NeuronSection,
    subsections: [
      { id: 'the-neuron--biology-to-math', title: '1. Biology to Math' },
      { id: 'the-neuron--interactive-neuron', title: '2. Interactive Neuron' },
      { id: 'the-neuron--python-code', title: '3. Python Code' },
    ],
  },
  {
    id: 'activation-functions',
    title: 'Activation Functions',
    group: 'Foundations',
    icon: Activity,
    component: ActivationFunctionsSection,
    subsections: [
      { id: 'activation-functions--why-non-linear', title: '1. Why Non-Linearity' },
      { id: 'activation-functions--interactive-curves', title: '2. Curves & Derivatives' },
      { id: 'activation-functions--python-code', title: '3. Python Code' },
    ],
  },
  {
    id: 'forward-propagation',
    title: 'Forward Propagation',
    group: 'Foundations',
    icon: ArrowRightCircle,
    component: ForwardPropagationSection,
    subsections: [
      { id: 'forward-propagation--pipeline', title: '1. Forward Pipeline' },
      { id: 'forward-propagation--interactive-network', title: '2. Interactive Network' },
      { id: 'forward-propagation--matrix-shapes', title: '3. Matrix Shapes' },
      { id: 'forward-propagation--python-code', title: '4. Python Code' },
    ],
  },
  {
    id: 'loss-functions',
    title: 'Loss Functions',
    group: 'Learning',
    icon: Target,
    component: LossFunctionsSection,
    subsections: [
      { id: 'loss-functions--bce', title: '1. Binary Cross-Entropy' },
      { id: 'loss-functions--bce-vs-mse', title: '2. BCE vs MSE' },
      { id: 'loss-functions--dataset-loss', title: '3. Dataset Loss Tool' },
      { id: 'loss-functions--python-code', title: '4. Python Code' },
    ],
  },
  {
    id: 'gradient-descent',
    title: 'Gradient Descent',
    group: 'Learning',
    icon: TrendingDown,
    component: GradientDescentSection,
    subsections: [
      { id: 'gradient-descent--foggy-hill', title: '1. Foggy Hill Analogy' },
      { id: 'gradient-descent--update-rule', title: '2. Parameter Update' },
      { id: 'gradient-descent--python-code', title: '3. Python Code' },
      { id: 'gradient-descent--interactive-1d', title: '4. Interactive 1D' },
      { id: 'gradient-descent--learning-rate-lab', title: '5. Learning Rate Lab' },
      { id: 'gradient-descent--loss-history', title: '6. Loss History' },
      { id: 'gradient-descent--2d-contour', title: '7. 2D Contour Valley' },
      { id: 'gradient-descent--minima-saddles', title: '8. Minima and Saddles' },
    ],
  },
  {
    id: 'backpropagation',
    title: 'Backpropagation',
    group: 'Learning',
    icon: RotateCcw,
    component: BackpropagationSection,
    subsections: [
      { id: 'backpropagation--chain-rule', title: '1. The Chain Rule' },
      { id: 'backpropagation--pixels-to-inputs', title: '2. Pixels to Inputs' },
      { id: 'backpropagation--computation-graph', title: '3. Computation Graph' },
      { id: 'backpropagation--matrix-gradients', title: '4. Matrix Gradients' },
      { id: 'backpropagation--network-pass', title: '5. Full Network Pass' },
      { id: 'backpropagation--python-code', title: '6. Python Code' },
    ],
  },
  {
    id: 'weight-initialization',
    title: 'Weight Initialization',
    group: 'Training',
    icon: Sparkles,
    component: WeightInitializationSection,
    subsections: [
      { id: 'weight-initialization--vanishing-signals', title: '1. Vanishing Signals' },
      { id: 'weight-initialization--histograms', title: '2. Layer Histograms' },
      { id: 'weight-initialization--xavier-he', title: '3. Xavier & He' },
      { id: 'weight-initialization--python-code', title: '4. Python Code' },
    ],
  },
  {
    id: 'mini-batch-sgd',
    title: 'Mini-batch SGD',
    group: 'Training',
    icon: Layers,
    component: MiniBatchSgdSection,
    subsections: [
      { id: 'mini-batch-sgd--batch-vs-sgd', title: '1. Batch vs SGD' },
      { id: 'mini-batch-sgd--contour-paths', title: '2. Contour Path Tool' },
      { id: 'mini-batch-sgd--variance-rule', title: '3. Variance Rule' },
      { id: 'mini-batch-sgd--python-code', title: '4. Python Code' },
    ],
  },
  {
    id: 'gradient-checking',
    title: 'Gradient Checking',
    group: 'Training',
    icon: ShieldCheck,
    component: GradientCheckingSection,
    subsections: [
      { id: 'gradient-checking--finite-diff', title: '1. Finite Difference' },
      { id: 'gradient-checking--check-tool', title: '2. Check Tool' },
      { id: 'gradient-checking--error-score', title: '3. Error Score' },
      { id: 'gradient-checking--python-code', title: '4. Python Code' },
    ],
  },
  {
    id: 'train-your-own-model',
    title: 'Train Your Own Model',
    group: 'Playground',
    icon: PlayCircle,
    component: TrainModelSection,
    subsections: [],
  },
] as const;

export const SECTION_GROUPS: readonly SectionItem['group'][] = [
  'Foundations',
  'Learning',
  'Training',
  'Playground',
] as const;
