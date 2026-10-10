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

import { BceVsMsePlot } from './loss-functions/BceVsMsePlot';
import { DatasetLossPlot } from './loss-functions/DatasetLossPlot';

const BCE_PYTHON_CODE = `# Binary Cross-Entropy loss in loss.py
class BinaryCrossEntropy:
    def forward(self, y_pred, y_true):
        # Clip values to prevent log(0) errors
        y_pred = np.clip(y_pred, 1e-15, 1.0 - 1e-15)
        loss = -(y_true * np.log(y_pred) + (1.0 - y_true) * np.log(1.0 - y_pred))
        return np.mean(loss)
        
    def backward(self, y_pred, y_true):
        # Combined derivative simplifies directly
        return (y_pred - y_true) / y_true.shape[0]`;

const BCE_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'clip-step',
    lines: [4, 5],
    title: 'Numerical clipping',
    equation: 'p \\leftarrow \\text{clip}(p, \\epsilon, 1 - \\epsilon)',
    explanation: (
      <span>
        Prevents <InlineCode>log(0)</InlineCode> errors.
        Clipping keeps predicted numbers strictly inside the safe interval.
      </span>
    ),
  },
  {
    id: 'bce-formula',
    lines: [6, 7],
    title: 'Cross-entropy evaluation',
    equation: 'L = -\\frac{1}{N} \\sum \\left[ y \\ln(p) + (1 - y) \\ln(1 - p) \\right]',
    explanation: (
      <span>
        Evaluates the loss for every sample in the batch and averages the scores.
      </span>
    ),
  },
  {
    id: 'bce-backward',
    lines: [10, 11],
    title: 'Output gradient calculation',
    equation: '\\frac{\\partial L}{\\partial z} = \\frac{\\hat{y} - y}{N}',
    explanation: (
      <span>
        The sigmoid derivative and BCE derivative cancel out cleanly.
        This leaves the raw prediction error scaled by batch size.
      </span>
    ),
  },
];

export function LossFunctionsSection(): JSX.Element {
  return (
    <SectionWrapper
      id="loss-functions"
      title="Loss Functions"
      eyebrow="Learning · Step 1"
    >
      <Reveal direction="up">
        <Lead>
          A loss function acts as the scoreboard for your neural network.
          It compares model predictions with true labels and returns a single penalty number.
          Training aims to adjust weights so this penalty drops as close to zero as possible.
        </Lead>
      </Reveal>

      {/* 1. Binary Cross-Entropy Definition */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="loss-functions--bce">1. Binary Cross-Entropy (BCE)</SubHeading>
        <P>
          For yes-or-no classification, you use <Term id="loss">Binary Cross-Entropy</Term>.
          It measures the distance between the true label and your predicted probability:
        </P>

        <MathEquation
          math="L(p, y) = -\big(y \ln(p) + (1 - y) \ln(1 - p)\big)"
          block
          label="Binary Cross-Entropy Loss Equation"
        />

        <P>
          Here, <MathEquation math="y \in \{0, 1\}" /> is the true target label.
          The term <MathEquation math="p \in (0, 1)" /> is the predicted probability from the network.
          When <MathEquation math="y = 1" />, the second term vanishes, leaving <MathEquation math="-\ln(p)" />.
          When <MathEquation math="y = 0" />, the first term vanishes, leaving <MathEquation math="-\ln(1 - p)" />.
        </P>
      </Reveal>

      {/* 2. Interactive BCE vs MSE Comparison */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="loss-functions--bce-vs-mse">2. Why Cross-Entropy Beats Mean Squared Error</SubHeading>
        <P>
          Why not use Mean Squared Error for classification?
          Compare both loss functions below across all probabilities:
        </P>

        <Figure
          caption="Loss Comparison: BCE vs. MSE across predicted probabilities."
          tryThis={[
            'Toggle between Class 1 and Class 0 to see how the curve mirrors horizontally.',
            'Drag p near 0.05 when y = 1 to see BCE climb above 3.0 while MSE stalls at 1.0.',
            'Check the gradients: BCE produces strong corrective signals for confident wrong predictions.',
          ]}
        >
          <BceVsMsePlot />
        </Figure>
      </Reveal>

      {/* 3. Intuition on Confident Errors */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="intuition" title="Punishing Confident Mistakes">
          If your model predicts <MathEquation math="p = 0.01" /> when the true answer is <MathEquation math="1" />,
          it is confidently wrong.
          MSE gives a modest penalty of only <MathEquation math="(0.01 - 1)^2 \approx 0.98" />.
          In contrast, BCE produces a massive penalty of <MathEquation math="-\ln(0.01) \approx 4.60" />.
          This steep curve creates large gradients that push the model out of bad regions fast.
        </Callout>
      </Reveal>

      {/* 4. Interactive 1D Points Dataset */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="loss-functions--dataset-loss">3. Dataset Loss on a 1D Classifier</SubHeading>
        <P>
          See how weights and biases shape total loss across a sample dataset.
          Move the sliders below to fit a sigmoid curve to six 1D points:
        </P>

        <Figure
          caption="1D Point Classifier: Dashed lines represent per-point BCE loss penalties."
          tryThis={[
            'Click Well-Separated to fit the curve neatly between both classes.',
            'Drag the bias slider b to slide the decision threshold left and right.',
            'Click Inverted to reverse the weights and watch the error bars turn red as loss spikes.',
          ]}
        >
          <DatasetLossPlot />
        </Figure>
      </Reveal>

      {/* 5. The Elegant Gradient Cancellation Callout */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="note" title="The Derivative Cancellation">
          When you combine a Sigmoid output with BCE loss, calculus reveals a clean simplification:
          <MathEquation
            math="\frac{\partial L}{\partial z} = \frac{\partial L}{\partial p} \cdot \frac{\partial p}{\partial z} = \frac{p - y}{p(1 - p)} \cdot p(1 - p) = p - y"
            block
            label="Sigmoid and BCE Derivative Cancellation"
          />
          The denominator <MathEquation math="p(1 - p)" /> cancels out completely.
          The error signal entering backpropagation is simply the raw difference: <InlineCode>p - y</InlineCode>.
        </Callout>
      </Reveal>

      {/* 6. Python CodeBlock */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="loss-functions--python-code">4. Code Implementation in Python</SubHeading>
        <P>
          Here is how <InlineCode>loss.py</InlineCode> computes the forward penalty and backward gradient:
        </P>

        <CodeBlock
          code={BCE_PYTHON_CODE}
          lang="python"
          title="loss.py · BinaryCrossEntropy"
          annotations={BCE_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 7. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          BCE penalizes confident wrong guesses much harder than MSE.
          Combining Sigmoid outputs with BCE cancels out non-linear denominators, leaving a clean error signal.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
