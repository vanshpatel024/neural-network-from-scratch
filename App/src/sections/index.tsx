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

export type { SectionItem, SectionGroup } from './types';
export { IntroductionSection };

export function NeuronSection(): JSX.Element {
  return (
    <SectionWrapper
      id="the-neuron"
      title="The Neuron"
      eyebrow="Foundations"
    >
      <p>
        A biological neuron collects signals from other cells and fires when the total signal is high enough.
        An artificial neuron does the same thing with simple math.
        You multiply each input by a weight, add a bias, and pass the sum through an activation function.
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
        An activation function bends the signal so a network can learn complex patterns.
        Without it, even deep networks can only draw straight lines.
        Here, you will explore Sigmoid and ReLU, see how they change the output, and learn why vanishing gradients happen.
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
        Forward propagation moves your data from the inputs to the final prediction.
        In each layer, you multiply inputs by weights, add a bias, and apply an activation function.
        You will trace matrix shapes step by step as data flows through the network.
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
        A loss function tells you how wrong your model is.
        It produces a single number that drops as predictions improve.
        Here, you will learn Binary Cross-Entropy loss for yes-or-no tasks and see how small values keep the math stable.
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
        Gradient descent adjusts weights to lower the loss.
        Think of it as walking down a foggy hill by feeling the slope under your feet.
        You will see how the learning rate controls your step size and helps you reach the lowest point.
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
        Backpropagation calculates how much each weight contributed to the total loss.
        It uses the chain rule from calculus, working backward from the output layer to the input.
        You will learn the exact matrix steps to compute these gradients.
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
