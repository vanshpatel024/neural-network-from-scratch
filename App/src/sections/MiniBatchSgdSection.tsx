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
import { MiniBatchContourPlot } from './mini-batch-sgd/MiniBatchContourPlot';

const MINIBATCH_PYTHON_CODE = `def fit(self, X, y, epochs=1000, batch_size=32):
    n_samples = X.shape[0]
    
    for epoch in range(epochs):
        # 1. Shuffle dataset at start of every epoch
        permutation = np.random.permutation(n_samples)
        X_shuffled = X[permutation]
        y_shuffled = y[permutation]
        
        epoch_loss = 0
        n_batches = 0
        
        # 2. Slice shuffled data into mini-batches
        for start in range(0, n_samples, batch_size):
            end = start + batch_size
            X_batch = X_shuffled[start:end]
            y_batch = y_shuffled[start:end]
            
            # 3. Forward pass on this batch only
            y_pred = self.forward(X_batch)
            
            # 4. Calculate loss on this batch only
            loss = self.loss_fn.forward(y_pred, y_batch)
            epoch_loss += loss
            n_batches += 1
            
            # 5. Backward pass on this batch only
            grad = self.loss_fn.backward(y_pred, y_batch)
            self.backward(grad)
            
            # 6. Update weights — one step per batch
            self.optimizer.step(self.layers)`;

const MINIBATCH_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'shuffle-step',
    lines: [6, 8],
    title: 'Per-epoch shuffling',
    equation: '\\pi \\sim \\text{Permutation}(N)',
    explanation: (
      <span>
        Shuffles training samples before each epoch so batches differ every time.
      </span>
    ),
  },
  {
    id: 'slice-step',
    lines: [14, 17],
    title: 'Mini-batch partitioning',
    equation: 'B = X[i : i + \\text{batch\\_size}]',
    explanation: (
      <span>
        Slices shuffled features and labels into compact batch matrices.
      </span>
    ),
  },
  {
    id: 'step-update',
    lines: [28, 32],
    title: 'Backward pass and optimizer step',
    equation: 'w \\leftarrow w - \\eta \\nabla_w L',
    explanation: (
      <span>
        Computes loss gradients on the batch and updates layer weights with the optimizer.
      </span>
    ),
  },
];

export function MiniBatchSgdSection(): JSX.Element {
  return (
    <SectionWrapper
      id="mini-batch-sgd"
      title="Mini-batch SGD"
      eyebrow="Training · Step 2"
    >
      <Reveal direction="up">
        <Lead>
          How many training examples should your model review before updating its weights?
          Checking only one point is erratic, while checking the whole dataset is slow.
          Mini-batch gradient descent strikes the ideal balance for modern hardware.
        </Lead>
      </Reveal>

      {/* 1. The Three Approaches */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="mini-batch-sgd--batch-vs-sgd">1. Batch, Stochastic, and Mini-batch</SubHeading>
        <P>
          Machine learning practitioners choose between three main batching strategies:
        </P>
        <P>
          1. <strong>Full Batch Gradient Descent</strong>: Uses all samples to compute exact slopes.
          The path moves smoothly downhill, but each step demands high computational effort.
        </P>
        <P>
          2. <strong>Stochastic Gradient Descent (SGD)</strong>: Updates weights after every single sample.
          Steps are lightning fast, but noise causes the path to wander erratically.
        </P>
        <P>
          3. <strong>Mini-batch SGD</strong>: Groups samples into small batches, typically 16, 32, or 64.
          This approach uses parallel vector hardware while dampening gradient noise.
        </P>
      </Reveal>

      {/* 2. Interactive Contour Comparison */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="mini-batch-sgd--contour-paths">2. Interactive Path Comparison on a 2D Contour</SubHeading>
        <P>
          Observe how batch size shapes the optimization path across the loss landscape below.
          Move the slider or compare all three modes at once:
        </P>

        <Figure
          caption="Optimization Paths: Compares gradient noise and trajectory smoothness across batch sizes."
          tryThis={[
            'Click Compare All 3 Modes and hit Play to watch all three paths race downhill.',
            'Observe how SGD (amber) zig-zags with high noise while Full Batch (green) glides smoothly.',
            'Select Mini-batch (B=16) and notice how small noise helps avoid stalling.',
            'Drag the batch size slider to 1 and watch noise level switch to High.',
          ]}
        >
          <MiniBatchContourPlot />
        </Figure>
      </Reveal>

      {/* 3. Mathematical Principles */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="mini-batch-sgd--variance-rule">3. Gradient Variance and the Square Root Rule</SubHeading>
        <P>
          Why does mini-batching work so well?
          The law of large numbers explains how noise decreases as batch size grows:
        </P>

        <MathEquation
          math="\sigma_{\text{batch}} = \frac{\sigma}{\sqrt{B}}"
          block
          label="Gradient Noise Standard Deviation"
        />

        <P>
          Increasing batch size from <MathEquation math="1" /> to <MathEquation math="16" /> cuts gradient variance by a factor of four.
          This reduction keeps descent steady without needing to compute the entire dataset.
        </P>
      </Reveal>

      {/* 4. Callout: Why Noise Can Help */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="intuition" title="Beneficial Stochastic Jitter">
          A small amount of gradient noise acts as an asset, not a flaw.
          Mild random jitter helps the optimizer pop out of shallow saddles and flat plateaus.
          Models trained with moderate mini-batches often generalize better to unseen test data.
        </Callout>
      </Reveal>

      {/* 5. Python Code Implementation */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="mini-batch-sgd--python-code">4. Code Implementation in Python</SubHeading>
        <P>
          Here is how <InlineCode>model.py</InlineCode> loops over mini-batches:
        </P>

        <CodeBlock
          code={MINIBATCH_PYTHON_CODE}
          lang="python"
          title="model.py · Sequential.fit"
          annotations={MINIBATCH_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 6. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Always shuffle your training dataset before every training epoch.
          Mini-batch sizes like 16, 32, and 64 maximize modern GPU memory bandwidth.
          Controlled noise helps models escape shallow saddles and generalize cleanly.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}

export default MiniBatchSgdSection;
