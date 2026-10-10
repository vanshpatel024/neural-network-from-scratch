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
import { GradCheckVisualizer } from './gradient-checking/GradCheckVisualizer';

const GRADCHECK_PYTHON_CODE = `# Gradient checking in gradcheck.py
import numpy as np

def gradient_check(model, X, y, epsilon=1e-5, threshold=1e-7):
    """
    Checks calculus backprop slopes using centered finite steps.
    """
    # 1. Compute calculus slopes via backprop
    model.forward(X)
    model.backward(y)
    
    max_relative_error = 0.0
    for layer in model.layers:
        for index, weight_val in np.ndenumerate(layer.W):
            analytical = layer.dW[index]
            
            # Finite difference: (L(w + eps) - L(w - eps)) / (2 * eps)
            layer.W[index] = weight_val + epsilon
            loss_plus = model.compute_loss(X, y)
            
            layer.W[index] = weight_val - epsilon
            loss_minus = model.compute_loss(X, y)
            
            layer.W[index] = weight_val  # Restore
            numerical = (loss_plus - loss_minus) / (2.0 * epsilon)
            
            # Relative error score
            denom = max(abs(analytical), abs(numerical), 1e-8)
            rel_error = abs(analytical - numerical) / denom
            max_relative_error = max(max_relative_error, rel_error)
            
    passed = max_relative_error < threshold
    return passed, max_relative_error`;

const GRADCHECK_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'centered-diff',
    lines: [18, 26],
    title: 'Centered difference step',
    equation: 'g_{\\text{num}} = \\frac{L(\\theta + \\epsilon) - L(\\theta - \\epsilon)}{2\\epsilon}',
    explanation: (
      <span>
        Nudges one weight forward and backward to measure slope directly.
      </span>
    ),
  },
  {
    id: 'relative-metric',
    lines: [28, 31],
    title: 'Relative error score',
    equation: '\\text{error} = \\frac{|g_{\\text{analytic}} - g_{\\text{num}}|}{\\max(|g_{\\text{analytic}}|, |g_{\\text{num}}|)}',
    explanation: (
      <span>
        Scales by slope size so tiny values do not cause false alarms.
      </span>
    ),
  },
];

export function GradientCheckingSection(): JSX.Element {
  return (
    <SectionWrapper
      id="gradient-checking"
      title="Gradient Checking"
      eyebrow="Training · Step 3"
    >
      <Reveal direction="up">
        <Lead>
          Backpropagation uses multi-step calculus.
          A tiny sign mistake can run without crashing while silently ruining your model.
          Gradient checking tests your code to prove your slope formulas work.
        </Lead>
      </Reveal>

      {/* 1. Numerical Approximation vs Analytical Gradients */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-checking--finite-diff">1. The Finite Difference Slope</SubHeading>
        <P>
          How can you test calculus without writing another derivation?
          You can estimate slopes using simple numerical nudges:
        </P>

        <MathEquation
          math="\frac{\partial L}{\partial \theta_i} \approx \frac{L(\theta_i + \epsilon) - L(\theta_i - \epsilon)}{2\epsilon}"
          block
          label="Finite Difference Formula"
        />

        <P>
          Here, <MathEquation math="\epsilon \approx 10^{-5}" /> is a tiny step.
          Testing both sides of the point makes this estimate much more accurate than one-sided steps.
        </P>
      </Reveal>

      {/* 2. Interactive Gradient Checker Visualizer */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-checking--check-tool">2. Interactive Gradient Check Tool</SubHeading>
        <P>
          Run a gradient check on a small network below.
          Compare your backprop derivatives against simple numerical slopes:
        </P>

        <Figure
          caption="Gradient check: Compares network weights and biases against numerical slopes."
          tryThis={[
            'See the pass status when code slopes and test slopes match closely.',
            'Click Inject Backprop Bug to introduce a deliberate derivative mistake in Layer 1.',
            'See error rise above 0.5 as the status badge turns red and fails.',
            'Click Fix Bug to restore correct analytical gradients and verify the pass.',
          ]}
        >
          <GradCheckVisualizer />
        </Figure>
      </Reveal>

      {/* 3. The Relative Error Metric */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-checking--error-score">3. Checking the Error Score</SubHeading>
        <P>
          Raw differences can mislead when slopes are very large or tiny.
          Instead, compare answers using normalized relative error:
        </P>

        <MathEquation
          math="\text{Relative Error} = \frac{\|\nabla_{\text{analytical}} - \nabla_{\text{numerical}}\|}{\max(\|\nabla_{\text{analytical}}\|, \|\nabla_{\text{numerical}}\|, 10^{-8})}"
          block
          label="Relative Error Formula"
        />

        <P>
          A relative error below <MathEquation math="10^{-7}" /> proves your backprop code is right.
          Values near <MathEquation math="10^{-4}" /> show small rounding error.
          Scores above <MathEquation math="10^{-3}" /> show a bug in your code.
        </P>
      </Reveal>

      {/* 4. Callout: Debugging Only */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="warning" title="Use Only During Testing">
          Never run gradient checking during real training.
          Checking each weight by hand needs two passes.
          For big networks, this takes far too long.
          Run this check on tiny test models to verify your math.
        </Callout>
      </Reveal>

      {/* 5. Python Code Implementation */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-checking--python-code">4. Code Implementation in Python</SubHeading>
        <P>
          Here is how <InlineCode>gradcheck.py</InlineCode> loops over parameters:
        </P>

        <CodeBlock
          code={GRADCHECK_PYTHON_CODE}
          lang="python"
          title="gradcheck.py · Gradient Checking"
          annotations={GRADCHECK_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 6. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Always use two-sided steps rather than one-sided steps.
          Error below 1e-7 proves your backprop slopes are exact.
          Run gradient checking as a test for new layers before training.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}

export default GradientCheckingSection;
