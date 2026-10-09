import { useState } from 'react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Math as MathEquation } from '@/components/ui/Math';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Callout } from '@/components/ui/Callout';
import { Figure } from '@/components/ui/Figure';
import {
  P,
  Lead,
  Heading,
  Subheading,
  Ul,
  Li,
  Ol,
  OlItem,
  InlineCode,
} from '@/components/ui/prose';
import { Reveal } from '@/components/ui/Reveal';
import { Slider } from '@/components/ui/Slider';
import { PlaybackControls } from '@/components/ui/PlaybackControls';
import { Stat } from '@/components/ui/Stat';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Toggle } from '@/components/ui/Toggle';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { Term } from '@/components/ui/Term';
import { usePlayback } from '@/hooks/usePlayback';
import { useElementSize } from '@/hooks/useElementSize';

import type { CodeAnnotation } from '@/components/ui/CodeBlock';

const SAMPLE_PYTHON_CODE = `# Multiply inputs by weights and add bias
def forward(self, X):
    self.X = X
    # Z = X · W + b
    self.Z = np.dot(X, self.weights) + self.bias
    return self.Z`;

const AFFINE_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'method-signature',
    lines: [1, 2],
    title: 'The forward step',
    equation: 'X \\in \\mathbb{R}^{m \\times 400}',
    explanation: (
      <span>
        This function takes a batch of images as matrix{' '}
        <MathEquation math="X" />. Here, <MathEquation math="m" /> is the count of
        images, and 400 is the number of pixels per image.
      </span>
    ),
    shapes: [
      {
        symbol: 'X',
        shape: '(m, 400)',
        note: 'Batch of m images with 400 pixels each',
      },
    ],
    notes: (
      <span>
        Matrix math runs all <MathEquation math="m" /> samples together in parallel.
        This is much faster than looping through one image at a time.
      </span>
    ),
  },
  {
    id: 'input-caching',
    lines: [3, 3],
    title: 'Saving the inputs',
    equation: 'A^{[l-1]} = X',
    explanation: (
      <span>
        You save the input <MathEquation math="X" /> inside the layer. Here,{' '}
        <MathEquation math="A^{[l-1]}" /> means the outputs from the earlier layer.
        You need these saved values later to find weight gradients during training.
      </span>
    ),
    shapes: [
      {
        symbol: 'self.X',
        shape: '(m, 400)',
        note: 'Input matrix saved for the backward pass',
      },
    ],
    notes: (
      <span>
        Saving inputs uses a little extra memory. It saves time because you do not
        need to compute them again.
      </span>
    ),
  },
  {
    id: 'affine-transformation',
    lines: [4, 5],
    title: 'Multiplying weights and adding bias',
    equation: 'Z^{[l]} = X \\cdot W^{[l]} + b^{[l]}',
    explanation: (
      <span>
        Here, <MathEquation math="X" /> is your input data,{' '}
        <MathEquation math="W^{[l]}" /> is the weight matrix for layer <MathEquation math="l" />,
        and <MathEquation math="b^{[l]}" /> is the bias offset. You multiply{' '}
        <MathEquation math="X" /> by the weights and add the bias.
      </span>
    ),
    shapes: [
      { symbol: 'X', shape: '(m, 400)', note: 'Input data matrix' },
      { symbol: 'W^{[l]}', shape: '(400, 25)', note: 'Layer weights connecting 400 inputs to 25 neurons' },
      { symbol: 'b^{[l]}', shape: '(1, 25)', note: 'Bias values added to each of the 25 neurons' },
      { symbol: 'Z^{[l]}', shape: '(m, 25)', note: 'Layer output before the activation step' },
    ],
    notes: (
      <span>
        NumPy adds the single bias row to each sample row. This gives every sample
        the same bias offset.
      </span>
    ),
  },
  {
    id: 'layer-return',
    lines: [6, 6],
    title: 'Returning layer output',
    equation: 'Z^{[l]} \\in \\mathbb{R}^{m \\times 25}',
    explanation: (
      <span>
        Here, <MathEquation math="Z^{[l]}" /> is the output matrix with{' '}
        <MathEquation math="m" /> rows and 25 columns. The layer returns these
        values so the next step can apply an activation function.
      </span>
    ),
    shapes: [
      {
        symbol: 'self.Z',
        shape: '(m, 25)',
        note: 'Output matrix passed to the next step',
      },
    ],
    notes: (
      <span>
        Checking the values in <MathEquation math="Z" /> helps you catch bugs early.
        It shows if numbers grow too large or shrink to zero.
      </span>
    ),
  },
];

export function IntroductionSection(): JSX.Element {
  // Interactive figure demonstration state
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [optimizer, setOptimizer] = useState<'SGD' | 'Momentum' | 'Adam'>('SGD');
  const [clipGradients, setClipGradients] = useState<boolean>(true);

  const playback = usePlayback({ initialSpeed: 2, maxTicks: 100 });
  const { ref: containerRef, width: containerWidth } = useElementSize<HTMLDivElement>();

  // Derived demonstration metric
  const simulatedLoss = Math.max(
    0.012,
    0.693 * Math.exp(-playback.tickCount * learningRate * 0.4)
  ).toFixed(4);

  const simulatedAccuracy = Math.min(
    99.2,
    50 + playback.tickCount * learningRate * 25
  ).toFixed(1);

  return (
    <SectionWrapper
      id="introduction"
      title="Introduction and Overview"
      eyebrow="Foundations · Step 0"
    >
      <Reveal direction="up">
        <Lead>
          Welcome to <strong className="text-text-primary">Neural Network From Scratch</strong>.
          This guide teaches you deep learning from basic principles.
          You will learn how each part works through clear math, code, and live visual tools.
        </Lead>
      </Reveal>

      <Reveal direction="up" delay={0.05}>
        <Heading>1. Project Goal</Heading>
        <P>
          Popular libraries like PyTorch make building networks fast, but they hide the math.
          In this guide, you will build every piece yourself using Python and NumPy.
          You will write your own <Term id="forwardPass">forward pass</Term>,{' '}
          <Term id="activation">activation functions</Term>,{' '}
          <Term id="loss">loss function</Term>, and{' '}
          <Term id="backpropagation">backpropagation</Term> step.
          Each layer multiplies inputs by <Term id="weights">weights</Term> and adds a{' '}
          <Term id="bias">bias</Term>, which is called an <Term id="affine">affine transformation</Term>.
        </P>
        <P>
          Your goal is to recognize hand-drawn images of the digits 0 and 1.
          The dataset has 1,000 images. Each image has 20 by 20 pixels, which makes 400 inputs.
          We write this input as a vector <MathEquation math="X \in \mathbb{R}^{1 \times 400}" />.
          Here, <MathEquation math="X" /> is a row vector with 400 numbers that represent pixel brightness.
        </P>

        <Subheading>Network Shape</Subheading>

        <MathEquation
          math="400 \xrightarrow{\text{Dense}_1} 25 \xrightarrow{\text{Dense}_2} 15 \xrightarrow{\text{Output}} 1"
          block
          label="Layer Sizes"
        />
        <P>
          Here, data flows from 400 pixel inputs through two hidden layers to one output value.
          The final number predicts whether an image is a 0 or a 1.
        </P>
      </Reveal>

      <Reveal direction="up" delay={0.05}>
        <Callout variant="intuition" title="Why First Principles Matter">
          Building a network by hand removes the mystery.
          Neural networks are not thinking brains.
          They are chains of simple math steps.
          You calculate <Term id="gradient">gradients</Term> to see how to adjust weights so the error goes down.
        </Callout>
      </Reveal>

      <Reveal direction="up" delay={0.05}>
        <Heading>2. Interactive Tools</Heading>
        <P>
          Every major topic in this guide includes a live tool.
          You can test your understanding by changing numbers and watching what happens:
        </P>

        <Ul>
          <Li>
            <strong className="text-text-primary">Change Values:</strong> Drag sliders to change
            the learning rate, batch size, or weights. You will see how the numbers change right away.
          </Li>
          <Li>
            <strong className="text-text-primary">Step Through Training:</strong> Use playback
            buttons to run training one step at a time.
          </Li>
          <Li>
            <strong className="text-text-primary">Connect Code to Math:</strong> Click code lines
            to see the formula and matrix shapes behind each step.
          </Li>
        </Ul>

        {/* Live Interactive Figure Demonstrating All Tooling Primitives */}
        <Figure
          caption="Interactive Control Deck: Test how sliders, buttons, and status cards work together."
          tryThis={[
            'Click Play to start the training run.',
            'Move the Learning Rate slider to change how fast the model learns.',
            'Switch between SGD, Momentum, and Adam to compare optimizers.',
            'Click Step to run one update at a time.',
          ]}
        >
          <div ref={containerRef} className="w-full space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <SegmentedControl
                options={['SGD', 'Momentum', 'Adam']}
                value={optimizer}
                onChange={setOptimizer}
                size="sm"
              />
              <Toggle
                label="Clip Gradients"
                checked={clipGradients}
                onChange={setClipGradients}
              />
            </div>

            {/* Parameter Sliders in ControlsGrid */}
            <ControlsGrid columns={2}>
              <Slider
                label="Learning Rate (α)"
                min={0.01}
                max={0.2}
                step={0.01}
                value={learningRate}
                onChange={setLearningRate}
              />
              <Slider
                label="Batch Size"
                min={4}
                max={64}
                step={4}
                value={16}
                onChange={() => {}}
                disabled
              />
            </ControlsGrid>

            {/* Playback Controls */}
            <PlaybackControls
              playback={playback}
              speedOptions={[1, 2, 5]}
              label="Simulated Epoch"
            />

            {/* Live Numeric Readouts in ControlsGrid */}
            <ControlsGrid columns={3}>
              <Stat
                label="BCE Loss"
                value={simulatedLoss}
                variant="accent"
                subtext="Binary Cross-Entropy"
              />
              <Stat
                label="Accuracy"
                value={simulatedAccuracy}
                unit="%"
                variant="success"
                subtext="Training Split"
              />
              <Stat
                label="Viewport Width"
                value={containerWidth}
                unit="px"
                variant="default"
                subtext="Measured Width"
              />
            </ControlsGrid>
          </div>
        </Figure>
      </Reveal>

      <Reveal direction="up" delay={0.05}>
        <Heading>3. Linking Code to Math</Heading>
        <P>
          Most tutorials keep code and math separate.
          In this guide, each code sample links directly to its formula.
          Click any line below to see its math and matrix shapes:
        </P>

        <CodeBlock
          code={SAMPLE_PYTHON_CODE}
          lang="python"
          title="layers.py · Forward Pass"
          annotations={AFFINE_CODE_ANNOTATIONS}
        />

        <Callout variant="note" title="Matrix Dimensions">
          Look at the multiplication order in <InlineCode>np.dot(X, self.weights)</InlineCode>.
          The input matrix <MathEquation math="X" /> has size <InlineCode>(N, 400)</InlineCode> for{' '}
          <MathEquation math="N" /> samples. The weight matrix has size <InlineCode>(400, 25)</InlineCode>.
          Multiplying them gives an output matrix <MathEquation math="Z" /> of size{' '}
          <InlineCode>(N, 25)</InlineCode>.
        </Callout>
      </Reveal>

      <Reveal direction="up" delay={0.05}>
        <Heading>4. Learning Roadmap</Heading>
        <P>
          The guide has four main parts. Each part builds on the one before it:
        </P>

        <Ol>
          <OlItem number={1}>
            <strong className="text-text-primary">Foundations:</strong> Learn how a single{' '}
            <Term id="neuron">neuron</Term> works. See how{' '}
            <Term id="activation">activation functions</Term> bend signals, and trace data
            through layers in the forward pass.
          </OlItem>
          <OlItem number={2}>
            <strong className="text-text-primary">Learning:</strong> Measure mistakes using{' '}
            <Term id="bce">binary cross-entropy loss</Term>. Learn how{' '}
            <Term id="gradient">gradients</Term> point downhill, and compute parameter updates with{' '}
            <Term id="backpropagation">backpropagation</Term>.
          </OlItem>
          <OlItem number={3}>
            <strong className="text-text-primary">Training:</strong> Pick good starting weights with{' '}
            <Term id="heInit">He initialization</Term>. Train faster with{' '}
            <Term id="sgd">mini-batch SGD</Term>, and check your math using{' '}
            <Term id="gradCheck">gradient checking</Term>.
          </OlItem>
          <OlItem number={4}>
            <strong className="text-text-primary">Interactive Studio:</strong> Train a model
            directly in your browser. Pick your settings, watch the loss drop, and test your
            network on drawn digits.
          </OlItem>
        </Ol>
      </Reveal>

      <Reveal direction="up" delay={0.05}>
        <Callout variant="warning" title="What You Need to Know">
          You do not need machine learning experience. Knowing basic Python and high school math is enough.
          We explain all calculus steps and matrix rules along the way.
        </Callout>

        <Callout variant="takeaway" title="Main Takeaway">
          Every neural network relies on the same core steps. You multiply inputs by weights,
          apply an activation function, and update weights using gradients.
          When you understand these steps here, you understand the engine behind modern AI.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
