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
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import type { SectionItem } from './types';
import { IntroductionSection } from './IntroductionSection';
import { NeuronSection } from './NeuronSection';
import { ActivationFunctionsSection } from './ActivationFunctionsSection';
import { ForwardPropagationSection } from './ForwardPropagationSection';
import { LossFunctionsSection } from './LossFunctionsSection';
import { GradientDescentSection } from './GradientDescentSection';
import { BackpropagationSection } from './BackpropagationSection';

export type { SectionItem, SectionGroup } from './types';
export {
  IntroductionSection,
  NeuronSection,
  ActivationFunctionsSection,
  ForwardPropagationSection,
  LossFunctionsSection,
  GradientDescentSection,
  BackpropagationSection,
};

export function WeightInitializationSection(): JSX.Element {
  return (
    <SectionWrapper
      id="weight-initialization"
      title="Weight Initialization"
      eyebrow="Training"
    >
      <p>
        Good starting weights help a network learn quickly.
        If weights start too large or too small, signals fade or blow up before learning begins.
        You will compare zero initialization, random values, and He initialization.
      </p>
    </SectionWrapper>
  );
}

export function MiniBatchSgdSection(): JSX.Element {
  return (
    <SectionWrapper
      id="mini-batch-sgd"
      title="Mini-batch SGD"
      eyebrow="Training"
    >
      <p>
        Mini-batch stochastic gradient descent updates weights using a small group of samples at each step.
        This approach trains faster than testing one sample at a time or the entire dataset at once.
        You will explore batch size, epochs, and training speed.
      </p>
    </SectionWrapper>
  );
}

export function GradientCheckingSection(): JSX.Element {
  return (
    <SectionWrapper
      id="gradient-checking"
      title="Gradient Checking"
      eyebrow="Training"
    >
      <p>
        Gradient checking verifies that your backpropagation code is correct.
        It compares your exact formulas with simple slope estimates calculated by nudging each weight.
        If both answers match closely, your code works as expected.
      </p>
    </SectionWrapper>
  );
}

export function TrainModelSection(): JSX.Element {
  return (
    <SectionWrapper
      id="train-your-own-model"
      title="Train Your Own Model"
      eyebrow="Playground"
    >
      <p>
        Here, you can build and train a neural network directly in your browser.
        Pick your layer sizes, set your learning rate, and watch the model find decision boundaries in real time.
      </p>
    </SectionWrapper>
  );
}

export const SECTIONS: readonly SectionItem[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    group: 'Foundations',
    icon: BookOpen,
    component: IntroductionSection,
  },
  {
    id: 'the-neuron',
    title: 'The Neuron',
    group: 'Foundations',
    icon: Cpu,
    component: NeuronSection,
  },
  {
    id: 'activation-functions',
    title: 'Activation Functions',
    group: 'Foundations',
    icon: Activity,
    component: ActivationFunctionsSection,
  },
  {
    id: 'forward-propagation',
    title: 'Forward Propagation',
    group: 'Foundations',
    icon: ArrowRightCircle,
    component: ForwardPropagationSection,
  },
  {
    id: 'loss-functions',
    title: 'Loss Functions',
    group: 'Learning',
    icon: Target,
    component: LossFunctionsSection,
  },
  {
    id: 'gradient-descent',
    title: 'Gradient Descent',
    group: 'Learning',
    icon: TrendingDown,
    component: GradientDescentSection,
  },
  {
    id: 'backpropagation',
    title: 'Backpropagation',
    group: 'Learning',
    icon: RotateCcw,
    component: BackpropagationSection,
  },
  {
    id: 'weight-initialization',
    title: 'Weight Initialization',
    group: 'Training',
    icon: Sparkles,
    component: WeightInitializationSection,
  },
  {
    id: 'mini-batch-sgd',
    title: 'Mini-batch SGD',
    group: 'Training',
    icon: Layers,
    component: MiniBatchSgdSection,
  },
  {
    id: 'gradient-checking',
    title: 'Gradient Checking',
    group: 'Training',
    icon: ShieldCheck,
    component: GradientCheckingSection,
  },
  {
    id: 'train-your-own-model',
    title: 'Train Your Own Model',
    group: 'Playground',
    icon: PlayCircle,
    component: TrainModelSection,
  },
] as const;

export const SECTION_GROUPS: readonly SectionItem['group'][] = [
  'Foundations',
  'Learning',
  'Training',
  'Playground',
] as const;
