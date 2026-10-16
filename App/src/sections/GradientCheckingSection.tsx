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

const GRADCHECK_TS_CODE = `export function gradientCheck(
  network: Sequential,
  X: number[][],
  y: number[][],
  eps = 1e-5,
  tolerance = 1e-6
): GradCheckResult {
  // 1. Compute analytical gradients via forward + backward
  network.forward(X);
  network.backward(y);

  let maxRelativeError = 0;
  let paramCount = 0;
  const details: GradCheckResult['details'] = [];

  // 2. Iterate through each layer and each parameter
  for (let l = 0; l < network.layers.length; l++) {
    const layer = network.layers[l]!;

    // Check weights
    for (let i = 0; i < layer.inputDim; i++) {
      for (let j = 0; j < layer.outputDim; j++) {
        paramCount++;
        const originalVal = layer.weights[i]![j]!;
        const analyticalGrad = layer.gradWeights[i]![j]!;

        // Theta + eps
        layer.weights[i]![j] = originalVal + eps;
        const lossPlus = bceLoss(network.forward(X), y);

        // Theta - eps
        layer.weights[i]![j] = originalVal - eps;
        const lossMinus = bceLoss(network.forward(X), y);

        // Restore
        layer.weights[i]![j] = originalVal;

        const numericalGrad = (lossPlus - lossMinus) / (2 * eps);
        const denominator = Math.max(
          Math.abs(analyticalGrad),
          Math.abs(numericalGrad),
          1e-8
        );
        const relativeError =
          Math.abs(analyticalGrad - numericalGrad) / denominator;

        if (relativeError > maxRelativeError) {
          maxRelativeError = relativeError;
        }

        details.push({
          layerIndex: l,
          paramType: 'weight',
          coord: [i, j],
          analytical: analyticalGrad,
          numerical: numericalGrad,
          relativeError,
        });
      }
    }

    // Check biases
    for (let j = 0; j < layer.outputDim; j++) {
      paramCount++;
      const originalVal = layer.biases[j]!;
      const analyticalGrad = layer.gradBiases[j]!;

      // Theta + eps
      layer.biases[j] = originalVal + eps;
      const lossPlus = bceLoss(network.forward(X), y);

      // Theta - eps
      layer.biases[j] = originalVal - eps;
      const lossMinus = bceLoss(network.forward(X), y);

      // Restore
      layer.biases[j] = originalVal;

      const numericalGrad = (lossPlus - lossMinus) / (2 * eps);
      const denominator = Math.max(
        Math.abs(analyticalGrad),
        Math.abs(numericalGrad),
        1e-8
      );
      const relativeError =
        Math.abs(analyticalGrad - numericalGrad) / denominator;

      if (relativeError > maxRelativeError) {
        maxRelativeError = relativeError;
      }

      details.push({
        layerIndex: l,
        paramType: 'bias',
        coord: [j],
        analytical: analyticalGrad,
        numerical: numericalGrad,
        relativeError,
      });
    }
  }

  // Restore network state by running a clean forward pass
  network.forward(X);

  return {
    passed: maxRelativeError <= tolerance,
    maxRelativeError,
    paramCount,
    details,
  };
}`;

const GRADCHECK_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'analytical-pass',
    lines: [8, 10],
    title: 'Analytical backprop',
    equation: '\\nabla_\\theta L',
    explanation: (
      <span>
        Runs forward and backward passes to compute exact analytical gradients.
      </span>
    ),
  },
  {
    id: 'centered-diff',
    lines: [27, 38],
    title: 'Centered difference step',
    equation: 'g_{\\text{num}} = \\frac{L(\\theta + \\epsilon) - L(\\theta - \\epsilon)}{2\\epsilon}',
    explanation: (
      <span>
        Nudges one weight forward and backward to estimate the slope directly.
      </span>
    ),
  },
  {
    id: 'relative-metric',
    lines: [39, 45],
    title: 'Relative error score',
    equation: '\\text{error} = \\frac{|g_{\\text{analytic}} - g_{\\text{num}}|}{\\max(|g_{\\text{analytic}}|, |g_{\\text{num}}|, 10^{-8})}',
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

      {/* Optional Note */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="note" title="Optional">
          The project's Python code does not include this.
          It is good to understand, but you do not need it to follow the rest.
        </Callout>
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

      {/* 5. TypeScript Code Implementation */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-checking--code">4. Code Implementation in TypeScript</SubHeading>
        <P>
          The demo on this page runs this code.
          The Python project does not include a gradient checker.
          Here is how <InlineCode>gradcheck.ts</InlineCode> loops over parameters:
        </P>

        <CodeBlock
          code={GRADCHECK_TS_CODE}
          lang="typescript"
          title="gradcheck.ts · The website's version"
          annotations={GRADCHECK_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 6. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Always use two-sided steps rather than one-sided steps.
          Error below 1e-7 proves your backprop slopes are exact.
          Use this check in testing before training big models.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}

export default GradientCheckingSection;
