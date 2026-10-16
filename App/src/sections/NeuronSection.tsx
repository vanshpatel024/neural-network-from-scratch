import { useState } from 'react';
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

import { NeuronDiagram } from './neuron/NeuronDiagram';

const NEURON_PYTHON_CODE = `# A single artificial neuron with two inputs
def forward(x1, x2, w1, w2, b):
    # Linear weighted sum
    z = w1 * x1 + w2 * x2 + b
    # Non-linear sigmoid activation
    a = 1.0 / (1.0 + np.exp(-z))
    return z, a`;

const NEURON_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'neuron-function',
    lines: [1, 2],
    title: 'Neuron interface',
    equation: 'x \\in \\mathbb{R}^2, \\; w \\in \\mathbb{R}^2',
    explanation: (
      <span>
        Takes two input features <MathEquation math="x_1" /> and <MathEquation math="x_2" /> along
        with their corresponding weights and scalar bias.
      </span>
    ),
  },
  {
    id: 'linear-sum',
    lines: [3, 4],
    title: 'Weighted sum pre-activation',
    equation: 'z = w_1 x_1 + w_2 x_2 + b',
    explanation: (
      <span>
        Here, <MathEquation math="w_1" /> and <MathEquation math="w_2" /> scale the inputs, and{' '}
        <MathEquation math="b" /> shifts the total sum. This step computes the linear combination.
      </span>
    ),
  },
  {
    id: 'sigmoid-step',
    lines: [5, 6],
    title: 'Sigmoid activation squashing',
    equation: 'a = \\sigma(z) = \\frac{1}{1 + e^{-z}}',
    explanation: (
      <span>
        Here, <MathEquation math="a" /> is the squashed output between 0 and 1.
        Numbers above 0.5 predict Class 1, while numbers below 0.5 predict Class 0.
      </span>
    ),
  },
  {
    id: 'neuron-return',
    lines: [7, 7],
    title: 'Returning values',
    equation: '(z, a) \\in \\mathbb{R} \\times (0, 1)',
    explanation: (
      <span>
        Returns both the pre-activation <MathEquation math="z" /> and the final activation{' '}
        <MathEquation math="a" /> for layer evaluation.
      </span>
    ),
  },
];

export function NeuronSection(): JSX.Element {
  // Neuron interactive state
  const [x1, setX1] = useState<number>(1.2);
  const [x2, setX2] = useState<number>(0.8);
  const [w1, setW1] = useState<number>(1.5);
  const [w2, setW2] = useState<number>(1.0);
  const [b, setB] = useState<number>(-1.5);

  const handleApplyPreset = (newW1: number, newW2: number, newB: number): void => {
    setW1(newW1);
    setW2(newW2);
    setB(newB);
  };

  return (
    <SectionWrapper
      id="the-neuron"
      title="The Neuron"
      eyebrow="Foundations · Step 1"
    >
      <Reveal direction="up">
        <Lead>
          The neuron is the basic building block of deep learning.
          It combines input numbers, adds an adjustable bias, and runs the sum through an activation curve.
          Even a single neuron can draw a linear boundary to split data into two classes.
        </Lead>
      </Reveal>

      {/* 1. Biology to Math */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="the-neuron--biology-to-math">1. From Biology to Linear Math</SubHeading>
        <P>
          Biological neurons collect chemical signals through dendrites.
          When the total charge reaches a threshold, the cell fires an electrical pulse along its axon.
        </P>
        <P>
          An artificial neuron copies this mechanism with simple arithmetic.
          It scales each input by a <Term id="weights">weight</Term>, adds a <Term id="bias">bias</Term>,
          and passes the result to an <Term id="activation">activation function</Term>:
        </P>

        <MathEquation
          math="z = w_1 x_1 + w_2 x_2 + b \qquad a = \sigma(z)"
          block
          label="Neuron Activation Equations"
        />

        <P>
          Here, <MathEquation math="x_1" /> and <MathEquation math="x_2" /> are input numbers,
          such as pixel values.
          The terms <MathEquation math="w_1" /> and <MathEquation math="w_2" /> are weights
          measuring the strength of each input.
          The letter <MathEquation math="b" /> is the bias offset, and <MathEquation math="a" /> is the final output.
        </P>
      </Reveal>

      {/* 2. Interactive Neuron Figure */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="the-neuron--interactive-neuron">2. Interactive Neuron & Decision Boundary</SubHeading>
        <P>
          In 2D space, the equation <InlineCode>w₁x₁ + w₂x₂ + b = 0</InlineCode> forms a straight line.
          This line divides the plane into two prediction regions:
        </P>

        <Figure
          caption="Single Neuron Architecture: Adjust inputs and weights to see the decision line shift in real time."
          tryThis={[
            'Drag w₁ and w₂ to rotate the decision boundary line.',
            'Adjust bias b to slide the line across the plane without rotating it.',
            'Move input point (x₁, x₂) into the blue region to see activation a cross 0.5.',
            'Click the preset buttons to explore vertical, horizontal, and diagonal splits.',
          ]}
        >
          <NeuronDiagram
            x1={x1}
            x2={x2}
            w1={w1}
            w2={w2}
            b={b}
            onChangeX1={setX1}
            onChangeX2={setX2}
            onChangeW1={setW1}
            onChangeW2={setW2}
            onChangeB={setB}
            onApplyPreset={handleApplyPreset}
          />
        </Figure>
      </Reveal>

      {/* 3. Why Bias Matters Callout */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="intuition" title="Why Bias is Essential">
          Without bias (<MathEquation math="b = 0" />), the boundary line must pass through the origin <InlineCode>(0, 0)</InlineCode>.
          Adding bias lets the line shift freely across space, allowing the neuron to separate patterns anywhere on the plane.
        </Callout>
      </Reveal>

      {/* 4. CodeBlock */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="the-neuron--python-code">3. Neuron Code Implementation</SubHeading>
        <P>
          In Python, you compute a single neuron conceptually in two straightforward lines:
        </P>

        <CodeBlock
          code={NEURON_PYTHON_CODE}
          lang="python"
          title="Illustrative Example · Single Neuron Forward Step"
          annotations={NEURON_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 5. Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          A single neuron draws a single linear decision line.
          To solve non-linear problems, multiple neurons are combined in layers.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
