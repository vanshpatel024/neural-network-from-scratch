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
  Subheading,
  InlineCode,
} from '@/components/ui/prose';
import { Reveal } from '@/components/ui/Reveal';
import { Term } from '@/components/ui/Term';

import { PixelInspector } from './backpropagation/PixelInspector';
import { ScalarGraphVisualizer } from './backpropagation/ScalarGraphVisualizer';
import { NetworkBackpropDiagram } from './backpropagation/NetworkBackpropDiagram';
import { DIGIT_0_SAMPLE, DIGIT_1_SAMPLE } from '@/lib/digitSamples';

const BACKPROP_PYTHON_CODE = `# Backward pass for Dense layer in layers.py
class Dense:
    def backward(self, dZ):
        # Backpropagate through activation if attached
        if self.activation is not None:
            dZ = self.activation.backward(dZ)
            
        # Parameter gradients
        self.dW = np.dot(self.X.T, dZ)
        self.db = np.sum(dZ, axis=0, keepdims=True)
        
        # Pass input gradient backward to preceding layer
        return np.dot(dZ, self.W.T)`;

const BACKPROP_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'act-backprop',
    lines: [4, 6],
    title: 'Activation backpropagation',
    equation: 'dZ = \\frac{\\partial L}{\\partial A} \\odot g\'(Z)',
    explanation: (
      <span>
        Multiplies the incoming gradient by the local activation slope.
        For ReLU, it passes positive gradients and blocks negative ones.
      </span>
    ),
  },
  {
    id: 'dw-gradient',
    lines: [8, 9],
    title: 'Weight gradient computation',
    equation: '\\frac{\\partial L}{\\partial W} = X^T \\cdot dZ',
    explanation: (
      <span>
        Multiplies transposed cached input <InlineCode>self.X</InlineCode> by incoming error <InlineCode>dZ</InlineCode>.
        This assigns blame to each weight in proportion to its input signal.
      </span>
    ),
  },
  {
    id: 'db-gradient',
    lines: [10, 10],
    title: 'Bias gradient computation',
    equation: '\\frac{\\partial L}{\\partial b} = \\sum_{i=1}^m dZ_i',
    explanation: (
      <span>
        Sums errors down the batch rows because the same bias is added to every sample.
      </span>
    ),
  },
  {
    id: 'dx-gradient',
    lines: [12, 13],
    title: 'Input gradient propagation',
    equation: '\\frac{\\partial L}{\\partial X} = dZ \\cdot W^T',
    explanation: (
      <span>
        Returns the error signal with respect to input <InlineCode>X</InlineCode>.
        The previous layer receives this value as its incoming error note.
      </span>
    ),
  },
];

export function BackpropagationSection(): JSX.Element {
  const defaultCenterIdx = 210;
  const [selectedDigitType, setSelectedDigitType] = useState<'0' | '1'>('1');
  const [targetY, setTargetY] = useState<0 | 1>(1);
  const [activePixelIdx, setActivePixelIdx] = useState<number>(defaultCenterIdx);
  const [x, setX] = useState<number>(DIGIT_1_SAMPLE.pixels[defaultCenterIdx] ?? 0.99);

  const handleSelectSample = (type: '0' | '1'): void => {
    setSelectedDigitType(type);
    if (type === '0') {
      const px = DIGIT_0_SAMPLE.pixels[activePixelIdx] ?? 0.0;
      setX(parseFloat(px.toFixed(2)));
      setTargetY(0);
    } else {
      const px = DIGIT_1_SAMPLE.pixels[activePixelIdx] ?? 0.99;
      setX(parseFloat(px.toFixed(2)));
      setTargetY(1);
    }
  };

  const handleSelectPixel = (idx: number, val: number): void => {
    setActivePixelIdx(idx);
    setX(val);
  };

  return (
    <SectionWrapper
      id="backpropagation"
      title="Backpropagation"
      eyebrow="Learning · Step 2"
    >
      <Reveal direction="up">
        <Lead>
          <Term id="backpropagation">Backpropagation</Term> finds how much each weight contributed to the total loss.
          It uses the chain rule in reverse, working from output error back to inputs.
          In one backward pass, all parameters receive their gradients.
        </Lead>
      </Reveal>

      {/* 1. The Chain Rule on a Classification Neuron */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="backpropagation--chain-rule">1. The Chain Rule on a Classification Neuron</SubHeading>
        <P>
          Look at a neuron classifying digits 0 and 1.
          It takes input pixel <MathEquation math="x" />, multiplies by weight <MathEquation math="w" />, and adds bias <MathEquation math="b" />:
        </P>

        <MathEquation
          math="z = w \cdot x + b, \qquad \hat{y} = \sigma(z) = \frac{1}{1 + e^{-z}}"
          block
          label="Neuron Prediction"
        />

        <P>
          To score the prediction, we compute binary cross-entropy loss against true label <MathEquation math="y \in \{0, 1\}" />:
        </P>

        <MathEquation
          math="L = -[y \ln(\hat{y}) + (1 - y) \ln(1 - \hat{y})]"
          block
          label="Binary Cross-Entropy Loss"
        />

        <P>
          To update weight <MathEquation math="w" />, we pass gradients from loss <MathEquation math="L" /> back to <MathEquation math="w" /> with the chain rule:
        </P>

        <MathEquation
          math="\frac{\partial L}{\partial w} = \frac{\partial L}{\partial \hat{y}} \cdot \frac{\partial \hat{y}}{\partial z} \cdot \frac{\partial z}{\partial w} = \frac{\hat{y} - y}{\hat{y}(1 - \hat{y})} \cdot \hat{y}(1 - \hat{y}) \cdot x = (\hat{y} - y) \cdot x"
          block
          label="Chain Rule Multiplication"
        />

        <P>
          The sigmoid slope cancels out the loss denominator.
          The error residual <MathEquation math="\hat{y} - y" /> scales directly by pixel <MathEquation math="x" />.
        </P>
      </Reveal>

      {/* 2. From Image Pixels to Network Inputs */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="backpropagation--pixels-to-inputs">2. From Image Pixels to Network Inputs</SubHeading>
        <P>
          Computers do not see pictures like human eyes do. They only see numbers.
          A grayscale image is a grid of numbers from 0.0 (pure black) to 1.0 (pure white).
          Our sample digit is 20 pixels wide and 20 pixels tall.
          That means it contains 400 pixels in total.
          In machine learning, every pixel is an input feature called <MathEquation math="x" />.
          When we pick one pixel, we choose one number to feed into our neuron.
        </P>

        <Figure
          caption="Interactive Pixel Inspector: Click any square on the 20×20 digit to choose pixel x for the computation graph below."
          tryThis={[
            'Switch between Digit 0 (y = 0) and Digit 1 (y = 1) to inspect different samples.',
            'Click Center Stroke to inspect a bright pixel in the ink stroke (x ≈ 0.99).',
            'Click Background to inspect a black border pixel (x = 0.00).',
            'Notice the 5×5 zoom loupe: it displays local numeric values around your cursor.',
          ]}
        >
          <PixelInspector
            className="w-full"
            selectedDigitType={selectedDigitType}
            onSelectSample={handleSelectSample}
            activePixelIdx={activePixelIdx}
            onSelectPixel={handleSelectPixel}
            x={x}
            targetY={targetY}
          />
        </Figure>

        <Subheading>How Real Neural Networks Process Images</Subheading>
        <P>
          In a real neural network, we do not pick one pixel by hand.
          Instead, the algorithm reads all 400 pixels at the same time.
          It flattens the 2D grid into a single column of numbers called a feature vector:
        </P>

        <MathEquation
          math="\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_{400} \end{bmatrix}, \qquad \mathbf{w} = \begin{bmatrix} w_1 \\ w_2 \\ \vdots \\ w_{400} \end{bmatrix}"
          block
          label="Pixel Vector and Weight Vector"
        />

        <P>
          The neuron multiplies each pixel by its weight and adds them together with a bias term:
        </P>

        <MathEquation
          math="z = \sum_{i=1}^{400} w_i x_i + b = \mathbf{w}^T \mathbf{x} + b"
          block
          label="Neuron Dot Product Across All Pixels"
        />

        <P>
          When the model makes an error, backpropagation calculates the gradient for every weight at once:
        </P>

        <MathEquation
          math="\frac{\partial L}{\partial w_i} = (\hat{y} - y) \cdot x_i \qquad \text{for every pixel } i \in \{1, \dots, 400\}"
          block
          label="Simultaneous Weight Gradients"
        />

        <P>
          Notice how the pixel value scales the gradient:
        </P>

        <ul className="list-disc pl-6 space-y-2 text-body text-text-secondary">
          <li>
            If a pixel is black (<MathEquation math="x_i = 0" />), its weight gradient is zero.
            The model does not change that weight because it had no effect on the prediction.
          </li>
          <li>
            If a pixel is bright (<MathEquation math="x_i = 1" />), its weight receives the full error signal.
          </li>
        </ul>

        <P>
          In Python with NumPy, the computer updates all 400 weights in one line of code:
          <InlineCode>dW = (y_hat - y) * X</InlineCode>.
        </P>

        <Callout variant="intuition" title="Why We Isolate One Pixel Below">
          Drawing 400 parallel inputs and 400 weights would create a tangled knot of wires.
          By tracking one pixel, we can watch every arithmetic step and derivative clearly.
          The math you see below for one pixel is the exact same math that runs 400 times in parallel inside real neural networks.
        </Callout>
      </Reveal>

      {/* 3. Interactive Digit Classification Computation Graph */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="backpropagation--computation-graph">3. Interactive Computation Graph</SubHeading>
        <P>
          Step through forward and backward passes on this digit classifier.
          Watch error flow backward to calculate weight and bias gradients:
        </P>

        <Figure
          caption="Digit Classification Autograd Graph: Forward values appear in blue; backward gradients appear in green."
          tryThis={[
            'Select a pixel in the Pixel Inspector above to see it load into the graph.',
            'Click Next Step three times to compute score z, prediction ŷ, and loss L.',
            'Click Next Step to watch the chain rule send gradients backward.',
            'Notice the weight gradient: it equals the error residual (ŷ - y) times pixel x.',
          ]}
        >
          <ScalarGraphVisualizer
            className="w-full"
            selectedDigitType={selectedDigitType}
            onSelectSample={handleSelectSample}
            activePixelIdx={activePixelIdx}
            onSelectPixel={handleSelectPixel}
            x={x}
            onXChange={(val) => setX(val)}
            targetY={targetY}
          />
        </Figure>
      </Reveal>

      {/* 4. The Layer Equations */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="backpropagation--matrix-gradients">4. Layer Gradients in Matrix Form</SubHeading>
        <P>
          In a neural network layer, the forward step is <InlineCode>Z = X · W + b</InlineCode>.
          When the layer receives incoming error signal <MathEquation math="dZ" />, calculus gives three formulas:
        </P>

        <MathEquation
          math="\frac{\partial L}{\partial W} = X^T \cdot dZ \qquad \frac{\partial L}{\partial b} = \sum dZ \qquad \frac{\partial L}{\partial X} = dZ \cdot W^T"
          block
          label="Dense Layer Matrix Gradients"
        />

        <P>
          Here, <MathEquation math="X" /> is the input cached during forward propagation.
          The matrix <MathEquation math="dZ" /> holds the incoming gradient, and <MathEquation math="W^T" /> is the transposed weights.
        </P>

        <Callout variant="intuition" title="The Footprint Intuition">
          Why does <MathEquation math="dW = X^T dZ" /> hold?
          If an input pixel was zero, its weight had zero influence on the prediction error.
          If an input pixel was large, its weight had huge influence.
          Transposing <MathEquation math="X" /> scales each weight gradient by the exact input that activated it.
        </Callout>
      </Reveal>

      {/* 5. Interactive 2-3-1 Network Backpropagation */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="backpropagation--network-pass">5. Backpropagation Through a 2-3-1 Network</SubHeading>
        <P>
          Now step backward through the two-layer network you explored earlier.
          Edges highlight the gradient on each weight:
        </P>

        <Figure
          caption="2-3-1 Network Backpropagation: Colored edges show weight gradients; line thickness indicates magnitude."
          tryThis={[
            'Click Step Backward to walk from output error dZ^[2] through the hidden layer to inputs.',
            'Notice edge colors: blue lines show positive gradients, while red lines show negative gradients.',
            'Watch the ReLU gate: hidden neurons with Z <= 0 block incoming gradients completely.',
            'Toggle target label between y = 1 and y = 0 to see error signs flip and edge colors invert.',
          ]}
        >
          <NetworkBackpropDiagram />
        </Figure>
      </Reveal>

      {/* 6. Gating Callout */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="warning" title="The ReLU Gradient Gate">
          Look at the hidden nodes during Step 3.
          If a neuron had negative input (<MathEquation math="Z \le 0" />), its forward output was zero.
          Its slope is zero, so the gradient stops at that neuron.
          This gate turns off weights that did not help the output.
        </Callout>
      </Reveal>

      {/* 7. Python CodeBlock */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="backpropagation--python-code">6. Code Implementation in Python</SubHeading>
        <P>
          Here is how <InlineCode>layers.py</InlineCode> implements the backward pass for a dense layer:
        </P>

        <CodeBlock
          code={BACKPROP_PYTHON_CODE}
          lang="python"
          title="layers.py · Dense.backward"
          annotations={BACKPROP_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 7. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Backpropagation passes error gradients backward along the exact paths data traveled forward.
          Cached inputs and pre-activations allow computing all parameter gradients in one reverse pass.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
