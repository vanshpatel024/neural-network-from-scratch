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

import { ActivationPlot } from './activation-functions/ActivationPlot';

const ACTIVATIONS_PYTHON_CODE = `# Activation classes implemented in activations.py
class ReLU:
    def forward(self, z):
        self.z = z
        return np.maximum(0, z)
        
    def backward(self, dA):
        return dA * (self.z > 0)

class Sigmoid:
    def forward(self, z):
        self.a = 1.0 / (1.0 + np.exp(-z))
        return self.a
        
    def backward(self, dA):
        return dA * (self.a * (1.0 - self.a))`;

const ACTIVATION_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'relu-forward',
    lines: [2, 5],
    title: 'ReLU forward step',
    equation: 'a = \\max(0, z)',
    explanation: (
      <span>
        Passes positive values unchanged and replaces negative numbers with zero.
        Here, <MathEquation math="z" /> is the layer input.
      </span>
    ),
  },
  {
    id: 'relu-backward',
    lines: [7, 8],
    title: 'ReLU backward step',
    equation: '\\frac{\\partial L}{\\partial z} = \\frac{\\partial L}{\\partial a} \\odot \\mathbf{1}_{z > 0}',
    explanation: (
      <span>
        Multiplies the incoming gradient by 1 for positive inputs and 0 for negative inputs.
        This rule keeps gradient signals flowing without shrinking.
      </span>
    ),
  },
  {
    id: 'sigmoid-forward',
    lines: [10, 13],
    title: 'Sigmoid forward step',
    equation: 'a = \\sigma(z) = \\frac{1}{1 + e^{-z}}',
    explanation: (
      <span>
        Squashes any real number into the range between 0 and 1.
        Saves the output <MathEquation math="a" /> for the backward pass.
      </span>
    ),
  },
  {
    id: 'sigmoid-backward',
    lines: [15, 16],
    title: 'Sigmoid backward step',
    equation: '\\frac{\\partial L}{\\partial z} = \\frac{\\partial L}{\\partial a} \\odot [a (1 - a)]',
    explanation: (
      <span>
        Uses the formula <MathEquation math="\sigma'(z) = a(1 - a)" />.
        The top slope is only 0.25, so gradients shrink by at least 75%.
      </span>
    ),
  },
];

export function ActivationFunctionsSection(): JSX.Element {
  const [selectedId, setSelectedId] = useState<'sigmoid' | 'tanh' | 'relu' | 'leaky-relu'>('relu');
  const [currentZ, setCurrentZ] = useState<number>(1.5);
  const [overlayAll, setOverlayAll] = useState<boolean>(false);

  return (
    <SectionWrapper
      id="activation-functions"
      title="Activation Functions"
      eyebrow="Foundations · Step 2"
    >
      <Reveal direction="up">
        <Lead>
          Without activation functions, even a deep neural network can only draw straight lines.
          Curved functions give networks the power to bend boundaries and learn complex patterns.
        </Lead>
      </Reveal>

      {/* 1. Why Non-Linearity Matters */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="activation-functions--why-non-linear">1. Why Networks Need Non-Linearity</SubHeading>
        <P>
          In linear algebra, multiplying matrices repeatedly just makes another single matrix.
          If you stack ten linear layers together without curves, the entire network collapses:
        </P>

        <MathEquation
          math="W_2 (W_1 X + b_1) + b_2 = (W_2 W_1) X + (W_2 b_1 + b_2) = W_{\text{combined}} X + b_{\text{combined}}"
          block
          label="Collapse of Stacked Linear Layers"
        />

        <P>
          Here, <MathEquation math="W_{\text{combined}}" /> is just one linear layer.
          Adding an <Term id="activation">activation function</Term> after each matrix step
          bends the signal so deep layers can learn non-linear patterns.
        </P>
      </Reveal>

      {/* 2. Interactive Activation Plot */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="activation-functions--interactive-curves">2. Interactive Curves & Derivatives</SubHeading>
        <P>
          Pick an activation below to see its function curve and slope plotted together.
          Drag the blue input handle along the curve to inspect slopes in real time:
        </P>

        <Figure
          caption="Activation Curves & Derivatives: Notice how the amber derivative curve behaves as input z moves into extreme regions."
          tryThis={[
            'Drag input z to +3 on Sigmoid and watch the amber derivative curve drop toward zero.',
            'Switch to ReLU and notice that the derivative is strictly 1.0 for all positive inputs.',
            'Turn on Overlay All Curves to directly compare Sigmoid, Tanh, ReLU, and Leaky ReLU.',
          ]}
        >
          <ActivationPlot
            selectedId={selectedId}
            currentZ={currentZ}
            overlayAll={overlayAll}
            onSelectId={setSelectedId}
            onDragZ={setCurrentZ}
            onToggleOverlay={setOverlayAll}
          />
        </Figure>
      </Reveal>

      {/* 3. Vanishing Gradient Problem Callout */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="warning" title="Saturation and Vanishing Gradients">
          Notice the amber dashed curve for Sigmoid. Its highest slope is only 0.25 at <MathEquation math="z = 0" />.
          For inputs outside <MathEquation math="[-3, 3]" />, the slope is almost zero.
          During backpropagation, multiplying small fractions across layers causes gradients to vanish:
          <MathEquation math="0.25 \times 0.25 \times 0.25 \times 0.25 \approx 0.0039" />.
          This is why modern deep networks use <Term id="relu">ReLU</Term> in hidden layers, where the slope stays 1.0.
        </Callout>
      </Reveal>

      {/* 4. CodeBlock */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="activation-functions--python-code">3. Code Implementation in Python</SubHeading>
        <P>
          Here is how <InlineCode>activations.py</InlineCode> implements both the forward activation
          and backward derivative:
        </P>

        <CodeBlock
          code={ACTIVATIONS_PYTHON_CODE}
          lang="python"
          title="activations.py · ReLU and Sigmoid"
          annotations={ACTIVATION_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 5. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Use ReLU for hidden layers because its slope does not shrink.
          Use Sigmoid at the final output neuron to produce a clean probability between 0 and 1.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
