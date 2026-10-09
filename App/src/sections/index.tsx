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

export type { SectionItem, SectionGroup } from './types';

// Section placeholder components
export function IntroductionSection(): JSX.Element {
  return (
    <SectionWrapper
      id="introduction"
      title="Introduction"
      eyebrow="Foundations"
    >
      <p>
        Welcome to Neural Network From Scratch. This interactive textbook guides you
        through constructing and training a multi-layer perceptron from first principles
        without third-party deep learning libraries. You will explore every equation,
        matrix dimension, and numerical step through live visual models.
      </p>
    </SectionWrapper>
  );
}

export function NeuronSection(): JSX.Element {
  return (
    <SectionWrapper
      id="the-neuron"
      title="The Neuron"
      eyebrow="Foundations"
    >
      <p>
        The biological neuron takes input signals, weighs them by synaptic strength,
        accumulates the net excitation, and fires an output when reaching a threshold.
        Here we define the artificial counterpart: a dot product of inputs and weights,
        an added bias, and a non-linear activation.
      </p>
    </SectionWrapper>
  );
}

export function ActivationFunctionsSection(): JSX.Element {
  return (
    <SectionWrapper
      id="activation-functions"
      title="Activation Functions"
      eyebrow="Foundations"
    >
      <p>
        Non-linear activations grant deep networks the capacity to approximate complex
        functions. We examine standard activation functions including Sigmoid and ReLU,
        their analytical derivatives, and the vanishing gradient problem.
      </p>
    </SectionWrapper>
  );
}

export function ForwardPropagationSection(): JSX.Element {
  return (
    <SectionWrapper
      id="forward-propagation"
      title="Forward Propagation"
      eyebrow="Foundations"
    >
      <p>
        Forward propagation passes input feature vectors through successive affine
        transformations and activations to generate output predictions. We trace the
        matrix arithmetic and tensor shapes from input dimensions through hidden layers.
      </p>
    </SectionWrapper>
  );
}

export function LossFunctionsSection(): JSX.Element {
  return (
    <SectionWrapper
      id="loss-functions"
      title="Loss Functions"
      eyebrow="Learning"
    >
      <p>
        The loss function quantifies discrepancy between predictions and ground-truth
        targets. We derive Binary Cross-Entropy loss from maximum likelihood estimation
        and inspect numerical stability considerations such as epsilon clipping.
      </p>
    </SectionWrapper>
  );
}

export function GradientDescentSection(): JSX.Element {
  return (
    <SectionWrapper
      id="gradient-descent"
      title="Gradient Descent"
      eyebrow="Learning"
    >
      <p>
        Optimization navigates high-dimensional loss landscapes in the opposite direction
        of the loss gradient. We inspect the effect of learning rates, step dynamics,
        and convergence behavior on convex and non-convex surfaces.
      </p>
    </SectionWrapper>
  );
}

export function BackpropagationSection(): JSX.Element {
  return (
    <SectionWrapper
      id="backpropagation"
      title="Backpropagation"
      eyebrow="Learning"
    >
      <p>
        Backpropagation applies the multivariate chain rule in reverse topological order,
        computing analytical gradients of the loss with respect to all parameters. We
        examine the precise transpose rules and dimension identities.
      </p>
    </SectionWrapper>
  );
}

export function WeightInitializationSection(): JSX.Element {
  return (
    <SectionWrapper
      id="weight-initialization"
      title="Weight Initialization"
      eyebrow="Training"
    >
      <p>
        Proper parameter initialization breaks symmetry and preserves signal variance
        across deep architectures. We compare Zero, Random Normal, and He (Kaiming)
        initialization schemes.
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
        Mini-batch stochastic gradient descent balances computational throughput and
        gradient variance by updating weights over randomized subsets of the training set.
        We review epoch schedules, batch slicing, and convergence stability.
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
        Gradient checking verifies analytical backpropagation implementations against
        two-sided numerical finite differences. We establish the tolerance threshold and
        relative difference formula to guarantee correctness.
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
        An interactive laboratory environment where you configure architecture hyperparameters,
        observe live loss curves, evaluate classification decision boundaries, and test
        predictions directly in the browser runtime.
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
