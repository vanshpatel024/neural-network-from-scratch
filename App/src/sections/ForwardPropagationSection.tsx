import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Math as MathEquation } from '@/components/ui/Math';
import { CodeBlock, type CodeAnnotation } from '@/components/ui/CodeBlock';
import { Callout } from '@/components/ui/Callout';
import { Figure } from '@/components/ui/Figure';
import {
  P,
  Lead,
  Heading,
  InlineCode,
} from '@/components/ui/prose';
import { Reveal } from '@/components/ui/Reveal';
import { Term } from '@/components/ui/Term';

import { NetworkForwardDiagram } from './forward-propagation/NetworkForwardDiagram';

const FORWARD_PYTHON_CODE = `# Dense layer forward pass (layers.py)
class Dense:
    def forward(self, X):
        self.X = X  # Cache input for backward pass
        if self.W is None:
            n_in = X.shape[1]
            self.W = np.random.randn(n_in, self.units) * np.sqrt(2 / n_in)
            self.b = np.zeros((1, self.units))
            
        self.Z = np.dot(X, self.W) + self.b
        if self.activation is not None:
            return self.activation.forward(self.Z)
        return self.Z

# Sequential model container (model.py)
class Sequential:
    def forward(self, X):
        for layer in self.layers:
            X = layer.forward(X)  # Output becomes next input
        return X`;

const FORWARD_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'cache-input',
    lines: [3, 4],
    title: 'Cache input data',
    equation: 'X \\in \\mathbb{R}^{m \\times n_{\\text{in}}}',
    explanation: (
      <span>
        Saves the input matrix on <InlineCode>self.X</InlineCode>.
        Backpropagation needs this matrix later to compute weight gradients.
      </span>
    ),
  },
  {
    id: 'lazy-init',
    lines: [5, 8],
    title: 'Lazy weight creation',
    equation: 'W \\in \\mathbb{R}^{n_{\\text{in}} \\times n_{\\text{out}}}, \\; b \\in \\mathbb{R}^{1 \\times n_{\\text{out}}}',
    explanation: (
      <span>
        Checks if weights exist.
        On the first forward step, it reads input size <InlineCode>n_in</InlineCode> and initializes weights.
      </span>
    ),
  },
  {
    id: 'matrix-dot',
    lines: [10, 10],
    title: 'Linear matrix product',
    equation: 'Z = X W + b',
    explanation: (
      <span>
        Multiplies the inputs by weights and adds the bias row vector.
        Saves <InlineCode>self.Z</InlineCode> for the backward pass.
      </span>
    ),
  },
  {
    id: 'apply-activation',
    lines: [11, 13],
    title: 'Non-linear activation',
    equation: 'A = g(Z)',
    explanation: (
      <span>
        Runs the pre-activation sum through the layer activation function, like ReLU or Sigmoid.
      </span>
    ),
  },
  {
    id: 'sequential-loop',
    lines: [16, 20],
    title: 'Sequential forward pipeline',
    equation: 'A^{[l]} = f^{[l]}(A^{[l-1]})',
    explanation: (
      <span>
        Loops through all layers in order.
        Each layer output overwrites <InlineCode>X</InlineCode> and feeds the next layer.
      </span>
    ),
  },
];

export function ForwardPropagationSection(): JSX.Element {
  return (
    <SectionWrapper
      id="forward-propagation"
      title="Forward Propagation"
      eyebrow="Foundations · Step 3"
    >
      <Reveal direction="up">
        <Lead>
          Forward propagation is the process that turns input features into a final prediction.
          Data flows layer by layer through the network from left to right.
          Each layer transforms the data with linear matrix math and a non-linear activation curve.
        </Lead>
      </Reveal>

      {/* 1. Mathematical Chaining */}
      <Reveal direction="up" delay={0.05}>
        <Heading>1. The Forward Math Pipeline</Heading>
        <P>
          In a neural network, layers form an assembly line.
          The output of one layer becomes the input for the next layer.
          For any layer <MathEquation math="l" />, the forward equations are:
        </P>

        <MathEquation
          math="Z^{[l]} = A^{[l-1]} W^{[l]} + b^{[l]} \qquad A^{[l]} = g^{[l]}(Z^{[l]})"
          block
          label="Layer Forward Equations"
        />

        <P>
          Here, <MathEquation math="A^{[l-1]}" /> is the activation from the previous layer.
          For the first layer, <MathEquation math="A^{[0]} = X" /> holds your raw input features.
          The matrix <MathEquation math="W^{[l]}" /> holds the weights, and <MathEquation math="b^{[l]}" /> is the bias vector.
          The function <MathEquation math="g^{[l]}" /> is the layer activation, like <Term id="relu">ReLU</Term> or <Term id="sigmoid">Sigmoid</Term>.
          Finally, <MathEquation math="A^{[l]}" /> is the layer output passed forward.
        </P>
      </Reveal>

      {/* 2. Interactive Network Figure */}
      <Reveal direction="up" delay={0.05}>
        <Heading>2. Interactive 2-3-1 Network</Heading>
        <P>
          Step through a complete forward pass in the small network below.
          You can edit the inputs, inspect the live matrix equations, and watch signals move along edges:
        </P>

        <Figure
          caption="Forward Propagation Pipeline: Step through each layer to inspect live substituted matrix math and node values."
          tryThis={[
            'Click Step Layer to advance from inputs, through hidden neurons, to the output.',
            'Observe edge colors: blue edges indicate positive weights, while red edges indicate negative weights.',
            'Notice edge thickness: thicker lines represent stronger weights with higher absolute magnitude.',
            'Adjust input sliders x₁ and x₂ to observe how internal node values respond.',
            'Click Randomize Weights to generate a new weight set and trace the updated values.',
          ]}
        >
          <NetworkForwardDiagram />
        </Figure>
      </Reveal>

      {/* 3. Shape Matching & Invariants */}
      <Reveal direction="up" delay={0.05}>
        <Heading>3. Tracking Matrix Shapes</Heading>
        <P>
          In neural networks, matrix shapes must match exactly at every step.
          When you multiply two matrices, the inner dimensions must match:
        </P>

        <MathEquation
          math="(m \times n_{\text{in}}) \cdot (n_{\text{in}} \times n_{\text{out}}) = (m \times n_{\text{out}})"
          block
          label="Matrix Multiplication Dimension Rule"
        />

        <P>
          Here, <MathEquation math="m" /> is the batch size, such as 1 or 32 samples.
          The term <MathEquation math="n_{\text{in}}" /> is the number of input features,
          and <MathEquation math="n_{\text{out}}" /> is the number of neurons in that layer.
        </P>

        <Callout variant="note" title="Shape Flow Example (Digit Classifier)">
          Consider classifying a 20×20 grayscale digit image (<MathEquation math="400" /> pixels):
          <br />
          • Input <InlineCode>X</InlineCode>: shape <InlineCode>(1, 400)</InlineCode>
          <br />
          • Layer 1 (<MathEquation math="25" /> units): weights <InlineCode>(400, 25)</InlineCode> → output <InlineCode>(1, 25)</InlineCode>
          <br />
          • Layer 2 (<MathEquation math="15" /> units): weights <InlineCode>(25, 15)</InlineCode> → output <InlineCode>(1, 15)</InlineCode>
          <br />
          • Output Layer (<MathEquation math="1" /> unit): weights <InlineCode>(15, 1)</InlineCode> → probability <InlineCode>(1, 1)</InlineCode>
        </Callout>
      </Reveal>

      {/* 4. Forward Caching Callout */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="intuition" title="Forward Caching for Backpropagation">
          Notice how the code stores <InlineCode>self.X</InlineCode> and <InlineCode>self.Z</InlineCode>.
          During training, backpropagation works backward from the loss to assign credit.
          Computing weight gradients requires the original inputs: <MathEquation math="dW = X^T dZ" />.
          Without caching during the forward pass, you would need to recompute every value from scratch.
        </Callout>
      </Reveal>

      {/* 5. CodeBlock */}
      <Reveal direction="up" delay={0.05}>
        <Heading>4. Python Implementation</Heading>
        <P>
          Here is how the <InlineCode>Dense</InlineCode> layer and <InlineCode>Sequential</InlineCode> model
          implement forward propagation in our project code:
        </P>

        <CodeBlock
          code={FORWARD_PYTHON_CODE}
          lang="python"
          title="layers.py & model.py · Forward Pass"
          annotations={FORWARD_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 6. Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Forward propagation chains linear matrix products and non-linear activation curves.
          Every layer saves its input and pre-activation sum so backpropagation can calculate gradients quickly.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
