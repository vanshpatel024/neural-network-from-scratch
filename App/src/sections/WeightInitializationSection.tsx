import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Math as MathEquation } from '@/components/ui/Math';
import { CodeBlock, type CodeAnnotation } from '@/components/ui/CodeBlock';
import { Callout } from '@/components/ui/Callout';
import { Figure } from '@/components/ui/Figure';
import {
  P,
  Lead,
  SubHeading,
  InlineCode,
} from '@/components/ui/prose';
import { Reveal } from '@/components/ui/Reveal';
import { Term } from '@/components/ui/Term';
import { WeightInitPlot } from './weight-initialization/WeightInitPlot';

const INITIALIZATION_PYTHON_CODE = `# Weight initialization in initializers.py
import numpy as np

def initialize_weights(input_dim, output_dim, method='xavier'):
    """
    Initializes weights and biases for a dense layer.
    """
    if method == 'zeros':
        # Failure case: breaks symmetry
        W = np.zeros((input_dim, output_dim))
    elif method == 'small':
        # Naive small: signals vanish in deep networks
        W = np.random.randn(input_dim, output_dim) * 0.01
    elif method == 'xavier':
        # Xavier / Glorot: optimal for tanh
        std = np.sqrt(2.0 / (input_dim + output_dim))
        W = np.random.randn(input_dim, output_dim) * std
    elif method == 'he':
        # He / Kaiming: optimal for ReLU
        std = np.sqrt(2.0 / input_dim)
        W = np.random.randn(input_dim, output_dim) * std
    else:
        raise ValueError(f"Unknown method: {method}")
        
    b = np.zeros(output_dim)
    return W, b`;

const INIT_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'xavier-formula',
    lines: [14, 17],
    title: 'Xavier scaling',
    equation: '\\sigma = \\sqrt{\\frac{2}{n_{\\text{in}} + n_{\\text{out}}}}',
    explanation: (
      <span>
        Matches the input and output neuron counts to keep signal variance steady.
      </span>
    ),
  },
  {
    id: 'he-formula',
    lines: [18, 21],
    title: 'He scaling',
    equation: '\\sigma = \\sqrt{\\frac{2}{n_{\\text{in}}}}',
    explanation: (
      <span>
        Accounts for ReLU setting negative signals to zero by doubling variance.
      </span>
    ),
  },
];

export function WeightInitializationSection(): JSX.Element {
  return (
    <SectionWrapper
      id="weight-initialization"
      title="Weight Initialization"
      eyebrow="Training · Step 1"
    >
      <Reveal direction="up">
        <Lead>
          Before training begins, you must pick starting weights for every layer.
          Starting with poor numbers can freeze training before the model takes its first useful step.
          Good initialization keeps numbers from shrinking to zero or blowing up across deep layers.
        </Lead>
      </Reveal>

      {/* 1. The Core Problem */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="weight-initialization--vanishing-signals">1. Vanishing and Exploding Signals</SubHeading>
        <P>
          In a deep network, each layer multiplies its incoming inputs by a weight matrix.
          Consider what happens as signals pass through many layers in a row:
        </P>
        <P>
          If initial weights are too small, each layer shrinks the signal.
          After five or six layers, values drop to zero and learning stops completely.
          If weights are too large, numbers explode toward infinity or force activations into hard saturation.
        </P>
      </Reveal>

      {/* 2. Interactive Layer Distribution Figure */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="weight-initialization--histograms">2. Interactive Layer Signal Distributions</SubHeading>
        <P>
          Observe signal spread across layers below.
          Move the depth slider and toggle between methods to see how signals behave:
        </P>

        <Figure
          caption="Activation Spread: Shows how initial weights shape signal strength across deep layers."
          tryThis={[
            'Click Small (0.01) and observe the line drop to zero as signals vanish.',
            'Click Large (1.0) with tanh to see activations slam against the extreme edges.',
            'Select Xavier on tanh to maintain a balanced spread across all six layers.',
            'Switch to ReLU and select He to prevent activations from collapsing.',
          ]}
        >
          <WeightInitPlot />
        </Figure>
      </Reveal>

      {/* 3. Mathematical Principles */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="weight-initialization--xavier-he">3. Xavier and He Formulas</SubHeading>
        <P>
          Researchers solved this problem with variance scaling formulas:
        </P>

        <MathEquation
          math="W \sim \mathcal{N}\left(0, \frac{2}{n_{\text{in}} + n_{\text{out}}}\right) \quad (\text{Xavier / Glorot for tanh})"
          block
          label="Xavier Initialization Formula"
        />

        <MathEquation
          math="W \sim \mathcal{N}\left(0, \frac{2}{n_{\text{in}}}\right) \quad (\text{He / Kaiming for ReLU})"
          block
          label="He Initialization Formula"
        />

        <P>
          <Term id="relu">ReLU</Term> turns off roughly half of all incoming inputs.
          To make up for lost energy, <Term id="he-init">He initialization</Term> doubles the variance.
          This keeps signal strength stable as depth grows.
        </P>
      </Reveal>

      {/* 4. Callout: Why Zeros Fail */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="warning" title="Why Zero Initialization Fails">
          Setting weights to zero seems tidy, but it causes complete symmetry.
          Every neuron in a layer computes the exact same output and receives identical gradients.
          Neurons never specialize because they never learn distinct features.
        </Callout>
      </Reveal>

      {/* 5. Python Code Implementation */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="weight-initialization--python-code">4. Code Implementation in Python</SubHeading>
        <P>
          Here is how <InlineCode>initializers.py</InlineCode> sets up weights:
        </P>

        <CodeBlock
          code={INITIALIZATION_PYTHON_CODE}
          lang="python"
          title="initializers.py · Weight Initialization"
          annotations={INIT_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 6. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Never initialize weights to zero in hidden layers.
          Use Xavier initialization when working with tanh or sigmoid.
          Always use He initialization when working with ReLU.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}

export default WeightInitializationSection;
