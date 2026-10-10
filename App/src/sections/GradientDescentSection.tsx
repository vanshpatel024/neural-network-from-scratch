import { useState, useEffect, useCallback } from 'react';
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
import { Slider } from '@/components/ui/Slider';
import { PlaybackControls } from '@/components/ui/PlaybackControls';
import { Stat } from '@/components/ui/Stat';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ControlsGrid } from '@/components/ui/ControlsGrid';
import { Term } from '@/components/ui/Term';

import {
  CONVEX_1D,
  NON_CONVEX_1D,
  step1D,
  detectOscillation1D,
  type Function1D,
} from '@/lib/optim';

import { Descent1DPlot, type DescentPoint } from './gradient-descent/Descent1DPlot';
import { LossChart } from './gradient-descent/LossChart';
import { ContourPlot2D } from './gradient-descent/ContourPlot2D';

const SGD_CODE = `# Update parameters in the opposite direction of the gradient
def step(self, layers):
    for layer in layers:
        if hasattr(layer, 'W'):
            # W = W - alpha * dW
            layer.W = layer.W - (self.learning_rate * layer.dW)
            # b = b - alpha * db
            layer.b = layer.b - (self.learning_rate * layer.db)`;

const SGD_CODE_ANNOTATIONS: readonly CodeAnnotation[] = [
  {
    id: 'method-signature',
    lines: [1, 2],
    title: 'The optimizer update step',
    equation: '\\theta \\leftarrow \\theta - \\alpha \\nabla_\\theta L',
    explanation: (
      <span>
        This method updates network parameters across all dense layers.
        Here, <MathEquation math="\theta" /> represents the weights and biases of the model.
      </span>
    ),
    notes: (
      <span>
        The optimizer runs once per batch after backpropagation computes the gradients.
      </span>
    ),
  },
  {
    id: 'layer-check',
    lines: [3, 4],
    title: 'Checking for trainable parameters',
    equation: 'W \\in \\mathbb{R}^{n_{\\text{in}} \\times n_{\\text{out}}}',
    explanation: (
      <span>
        Only layers with weight matrices have parameters to learn.
        Here, activation layers pass gradients backward without holding their own weights.
      </span>
    ),
  },
  {
    id: 'weight-update',
    lines: [5, 6],
    title: 'Updating the weight matrix',
    equation: 'W \\leftarrow W - \\alpha \\frac{\\partial L}{\\partial W}',
    explanation: (
      <span>
        Here, <MathEquation math="W" /> is the weight matrix,{' '}
        <MathEquation math="\alpha" /> is the learning rate, and{' '}
        <MathEquation math={'\\frac{\\partial L}{\\partial W}'} /> is the weight gradient.
        Subtracting the gradient nudges weights downhill to reduce the loss.
      </span>
    ),
    shapes: [
      {
        symbol: 'layer.W',
        shape: '(n_in, n_out)',
        note: 'Weight matrix updated in place',
      },
      {
        symbol: 'layer.dW',
        shape: '(n_in, n_out)',
        note: 'Gradient matrix from backpropagation',
      },
    ],
  },
  {
    id: 'bias-update',
    lines: [7, 8],
    title: 'Updating the bias vector',
    equation: 'b \\leftarrow b - \\alpha \\frac{\\partial L}{\\partial b}',
    explanation: (
      <span>
        Here, <MathEquation math="b" /> is the row vector of biases, and{' '}
        <MathEquation math={'\\frac{\\partial L}{\\partial b}'} /> is its gradient.
        You update each bias using the same learning rate.
      </span>
    ),
    shapes: [
      {
        symbol: 'layer.b',
        shape: '(1, n_out)',
        note: 'Bias vector updated in place',
      },
      {
        symbol: 'layer.db',
        shape: '(1, n_out)',
        note: 'Bias gradient vector',
      },
    ],
  },
];

export function GradientDescentSection(): JSX.Element {
  // 1D Descent Interactive State
  const [selectedFnId, setSelectedFnId] = useState<'convex' | 'non-convex'>('convex');
  const activeFn: Function1D = selectedFnId === 'convex' ? CONVEX_1D : NON_CONVEX_1D;

  const [currentX, setCurrentX] = useState<number>(activeFn.defaultX);
  const [learningRate, setLearningRate] = useState<number>(0.2);
  const [speed, setSpeed] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [history, setHistory] = useState<DescentPoint[]>([
    {
      step: 0,
      x: activeFn.defaultX,
      loss: activeFn.f(activeFn.defaultX),
      grad: activeFn.df(activeFn.defaultX),
    },
  ]);
  const [isDiverged, setIsDiverged] = useState<boolean>(false);

  // Single step execution
  const executeStep = useCallback((): boolean => {
    if (isDiverged) return false;

    const res = step1D(currentX, learningRate, activeFn);

    if (res.diverged) {
      setIsDiverged(true);
      setIsPlaying(false);
      setHistory((prev) => [
        ...prev,
        {
          step: prev.length,
          x: res.x,
          loss: Number.POSITIVE_INFINITY,
          grad: res.grad,
        },
      ]);
      return false;
    }

    setCurrentX(res.x);
    setHistory((prev) => [
      ...prev,
      {
        step: prev.length,
        x: res.x,
        loss: res.loss,
        grad: res.grad,
      },
    ]);
    return true;
  }, [currentX, learningRate, activeFn, isDiverged]);

  // Tick loop when playing
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(50, 1000 / speed);
    const interval = setInterval(() => {
      executeStep();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, executeStep]);

  // Reset run
  const handleReset = useCallback(
    (newX?: number, newFn?: Function1D): void => {
      setIsPlaying(false);
      setIsDiverged(false);
      const fn = newFn ?? activeFn;
      const x = newX ?? fn.defaultX;
      setCurrentX(x);
      setHistory([
        {
          step: 0,
          x,
          loss: fn.f(x),
          grad: fn.df(x),
        },
      ]);
    },
    [activeFn]
  );

  // Switching function
  const handleFunctionChange = (fnId: 'convex' | 'non-convex'): void => {
    setSelectedFnId(fnId);
    const targetFn = fnId === 'convex' ? CONVEX_1D : NON_CONVEX_1D;
    handleReset(targetFn.defaultX, targetFn);
  };

  // Dragging point on plot
  const handleDragPoint = (draggedX: number): void => {
    setIsPlaying(false);
    setIsDiverged(false);
    setCurrentX(draggedX);
    setHistory([
      {
        step: 0,
        x: draggedX,
        loss: activeFn.f(draggedX),
        grad: activeFn.df(draggedX),
      },
    ]);
  };

  // Lab Presets
  const applyPreset = (preset: 'small' | 'good' | 'large'): void => {
    setSelectedFnId('convex');
    if (preset === 'small') {
      setLearningRate(0.03);
      handleReset(2.5, CONVEX_1D);
    } else if (preset === 'good') {
      setLearningRate(0.2);
      handleReset(2.5, CONVEX_1D);
    } else {
      setLearningRate(1.05);
      handleReset(2.5, CONVEX_1D);
    }
  };

  // Diagnostic state analysis
  const currentLoss = activeFn.f(currentX);
  const currentGrad = activeFn.df(currentX);
  const isOscillating = detectOscillation1D(history);
  const isConverged = Math.abs(currentGrad) < 0.02 && !isDiverged;
  const isCrawling = learningRate <= 0.05 && !isConverged && history.length > 3;

  return (
    <SectionWrapper
      id="gradient-descent"
      title="Gradient Descent"
      eyebrow="Learning · Step 6"
    >
      <Reveal direction="up">
        <Lead>
          Backpropagation calculates slopes for every weight in your network.
          Gradient descent is the optimization engine that uses those slopes to teach the model.
          It nudges each parameter downhill so your prediction error steadily decreases.
        </Lead>
      </Reveal>

      {/* 1. Intuition */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--foggy-hill">1. The Foggy Hill Analogy</SubHeading>
        <P>
          Imagine you are standing on a steep hillside in thick fog.
          You cannot see the bottom of the valley.
          You can only feel the tilt of the ground directly under your shoes.
        </P>
        <P>
          To reach the bottom safely, you check which way the ground slopes.
          If the slope tilts upward ahead of you, you step backward.
          If the slope tilts downward, you step forward.
          Every step moves in the direction of steepest descent until the ground levels out.
        </P>
      </Reveal>

      {/* 2. Definition & Update Rule */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--update-rule">2. The Parameter Update Rule</SubHeading>
        <P>
          In a neural network, the ground height represents your <Term id="loss">loss</Term>.
          Your horizontal position represents your <Term id="weights">weights</Term>.
          At each step, you update parameters using this formula:
        </P>

        <MathEquation
          math="W \leftarrow W - \alpha \frac{\partial L}{\partial W} \qquad b \leftarrow b - \alpha \frac{\partial L}{\partial b}"
          block
          label="Gradient Descent Update Rule"
        />

        <P>
          Here, <MathEquation math="W" /> is your weight matrix, and <MathEquation math="b" /> is your bias vector.
          The derivative <MathEquation math={'\\frac{\\partial L}{\\partial W}'} /> is the <Term id="gradient">gradient</Term>,
          which measures how fast the loss changes when you adjust <MathEquation math="W" />.
          The symbol <MathEquation math="\alpha" /> (alpha) is the <Term id="learningRate">learning rate</Term>,
          which controls the size of each downhill step you take.
        </P>

        <Callout variant="intuition" title="Why the Minus Sign Matters">
          If the slope is positive, increasing the weight makes the loss go up.
          To reduce the loss, you must decrease the weight.
          If the slope is negative, decreasing the weight makes the loss go up.
          Subtracting the gradient always steers you downhill toward the minimum.
        </Callout>
      </Reveal>

      {/* 3. Code Implementation Mapping */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--python-code">3. Math to Python Implementation</SubHeading>
        <P>
          This update rule translates directly into Python inside our optimizer.
          Click any line below to see its exact formula:
        </P>

        <CodeBlock
          code={SGD_CODE}
          lang="python"
          title="optimizers.py · SGD Update Step"
          annotations={SGD_CODE_ANNOTATIONS}
        />
      </Reveal>

      {/* 4. Figure A: 1D Interactive Descent */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--interactive-1d">4. Interactive 1D Descent</SubHeading>
        <P>
          Test how a parameter rolls down a loss curve.
          Drag the starting point anywhere on the curve, set your learning rate, and press Play:
        </P>

        <Figure
          caption="1D Optimization Deck: Observe how the tangent slope guides each parameter update."
          tryThis={[
            'Drag the blue handle along the curve to choose a custom starting point.',
            'Press Play to let the point roll down into the bowl minimum.',
            'Change the Learning Rate slider mid-run to see how step size reacts.',
            'Switch to Two Wells and Saddle to see how start points change the outcome.',
          ]}
        >
          <div className="w-full space-y-4">
            {/* Top Function Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="text-label text-text-muted">Landscape:</span>
                <SegmentedControl
                  options={[
                    { value: 'convex', label: 'Convex Bowl' },
                    { value: 'non-convex', label: 'Two Wells & Saddle' },
                  ]}
                  value={selectedFnId}
                  onChange={handleFunctionChange}
                  size="sm"
                />
              </div>

              <div className="text-caption text-text-muted font-mono">
                {activeFn.latex}
              </div>
            </div>

            {/* Interactive Mafs Plot */}
            <Descent1DPlot
              fn={activeFn}
              currentX={currentX}
              history={history}
              onDragX={handleDragPoint}
            />

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 px-4 py-2.5">
              <PlaybackControls
                playback={{
                  isPlaying,
                  play: () => setIsPlaying(true),
                  pause: () => setIsPlaying(false),
                  togglePlay: () => setIsPlaying(!isPlaying),
                  step: () => {
                    executeStep();
                  },
                  reset: () => handleReset(),
                  speed,
                  setSpeed,
                  tickCount: history.length > 0 ? history.length - 1 : 0,
                }}
                speedOptions={[1, 2, 5]}
                label="Step"
              />

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-label text-text-muted">Status:</span>
                <span
                  className={`rounded border px-2.5 py-0.5 text-caption font-medium ${
                    isDiverged
                      ? 'border-danger/40 bg-danger/10 text-danger'
                      : isOscillating
                      ? 'border-warning/40 bg-warning/10 text-warning'
                      : isConverged
                      ? 'border-success/40 bg-success/10 text-success'
                      : isCrawling
                      ? 'border-accent/40 bg-accent/10 text-accent-light'
                      : 'border-border-subtle bg-elevated text-text-secondary'
                  }`}
                >
                  {isDiverged
                    ? 'Diverged to Infinity'
                    : isOscillating
                    ? 'Oscillating Across Valley'
                    : isConverged
                    ? 'Converged at Minimum'
                    : isCrawling
                    ? 'Crawling (Step Too Small)'
                    : 'Stepping Downhill'}
                </span>
              </div>
            </div>

            {/* Parameter Sliders */}
            <ControlsGrid columns={2}>
              <Slider
                label="Learning Rate (α)"
                min={0.01}
                max={1.15}
                step={0.01}
                value={learningRate}
                onChange={(val) => setLearningRate(parseFloat(val.toFixed(2)))}
              />
              <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-2 text-caption">
                <span className="text-text-muted">Tangent Slope Formula:</span>
                <span className="font-mono text-accent font-semibold">
                  {selectedFnId === 'convex' ? "f'(w) = 2w" : "f'(w) = w³ - 2w + 0.1"}
                </span>
              </div>
            </ControlsGrid>

            {/* Readouts Grid */}
            <ControlsGrid columns={4}>
              <Stat
                label="Parameter w"
                value={Number.isFinite(currentX) ? currentX.toFixed(3) : '∞'}
                variant="default"
                subtext="Current position"
              />
              <Stat
                label="Loss f(w)"
                value={Number.isFinite(currentLoss) ? currentLoss.toFixed(3) : '∞'}
                variant="accent"
                subtext="Objective height"
              />
              <Stat
                label="Slope df/dw"
                value={Number.isFinite(currentGrad) ? currentGrad.toFixed(3) : '∞'}
                variant="warning"
                subtext="Local derivative"
              />
              <Stat
                label="Steps Taken"
                value={history.length > 0 ? history.length - 1 : 0}
                variant="success"
                subtext="Optimization ticks"
              />
            </ControlsGrid>
          </div>
        </Figure>
      </Reveal>

      {/* 5. Learning Rate Lab */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--learning-rate-lab">5. Learning Rate Lab</SubHeading>
        <P>
          The learning rate <MathEquation math="\alpha" /> is the most important hyperparameter in training.
          Choose a preset below to see how step size shapes convergence:
        </P>

        <div className="my-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => applyPreset('small')}
            className={`rounded-lg border px-4 py-2 text-caption font-semibold transition-colors ${
              learningRate === 0.03 && selectedFnId === 'convex'
                ? 'border-accent bg-accent/15 text-accent-light'
                : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Too Small (α = 0.03)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('good')}
            className={`rounded-lg border px-4 py-2 text-caption font-semibold transition-colors ${
              learningRate === 0.2 && selectedFnId === 'convex'
                ? 'border-accent bg-accent/15 text-accent-light'
                : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Good (α = 0.20)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('large')}
            className={`rounded-lg border px-4 py-2 text-caption font-semibold transition-colors ${
              learningRate === 1.05 && selectedFnId === 'convex'
                ? 'border-accent bg-accent/15 text-accent-light'
                : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Too Large (α = 1.05)
          </button>
        </div>

        {/* Dynamic Diagnostic Feedback Alert */}
        {isDiverged && (
          <Callout variant="warning" title="Divergence Detected">
            The learning rate is too large.
            Each update overshoots the minimum by a wider margin than the previous step.
            The values explode exponentially toward infinity.
          </Callout>
        )}

        {isOscillating && !isDiverged && (
          <Callout variant="note" title="Oscillation Detected">
            The step size is larger than the width of the valley.
            The parameter bounces back and forth across the bottom instead of settling.
          </Callout>
        )}

        {isCrawling && (
          <Callout variant="note" title="Crawling Progress">
            The step size is very small.
            The updates move in the right direction, but require hundreds of steps to reach the bottom.
          </Callout>
        )}
      </Reveal>

      {/* 6. Figure B: Loss Chart Over Iterations */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--loss-history">6. Loss History Over Steps</SubHeading>
        <P>
          Every gradient descent run produces a loss curve.
          This chart records the value of <MathEquation math="f(w)" /> at every iteration:
        </P>

        <Figure caption="Live Loss Curve: Track how prediction error falls or spikes over successive iterations.">
          <LossChart data={history} />
        </Figure>
      </Reveal>

      {/* 7. Figure C: 2D Contour Descent & Momentum */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--2d-contour">7. 2D Descent in an Elongated Valley</SubHeading>
        <P>
          Real neural networks optimize millions of weights at the same time.
          In higher dimensions, loss valleys are rarely symmetrical circles.
          They are often narrow, elongated ravines:
        </P>

        <MathEquation
          math="f(w_1, w_2) = w_1^2 + 10w_2^2"
          block
          label="Elongated Ravine Objective"
        />

        <P>
          Here, the vertical axis <MathEquation math="w_2" /> curves 10 times steeper than <MathEquation math="w_1" />.
          With plain gradient descent and a high learning rate, updates bounce wildly from wall to wall.
          Turn on <strong className="text-accent">Momentum</strong> to see how velocity smooths out oscillations:
        </P>

        <Figure
          caption="2D Contour Map: Visualizing the ravine zig-zag effect and momentum damping."
          tryThis={[
            'Select High LR to see plain gradient descent bounce violently across the steep walls.',
            'Switch on Momentum to see velocity build along the valley floor while damping bounces.',
            'Click anywhere on the contour plot to set an arbitrary starting coordinate.',
          ]}
        >
          <ContourPlot2D />
        </Figure>
      </Reveal>

      {/* 8. Local Minima and Saddle Points */}
      <Reveal direction="up" delay={0.05}>
        <SubHeading id="gradient-descent--minima-saddles">8. Local Minima and Saddle Points</SubHeading>
        <P>
          Convex bowls are friendly because every downhill path leads to the same global bottom.
          Deep neural networks, however, form complex non-convex loss surfaces.
          These surfaces contain two key challenges:
        </P>

        <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-surface p-4">
            <h4 className="text-label text-accent font-semibold mb-1.5">
              Local Minima
            </h4>
            <p className="text-caption text-text-secondary leading-relaxed">
              Pockets where all surrounding slopes point upward, but the loss is higher than the true global minimum.
              Gradient descent has no memory of the wider landscape and cannot climb out on its own.
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-4">
            <h4 className="text-label text-warning font-semibold mb-1.5">
              Saddle Points & Plateaus
            </h4>
            <p className="text-caption text-text-secondary leading-relaxed">
              Flat regions where slopes drop close to zero in multiple directions.
              Because the derivative is tiny, updates shrink to near zero and training stalls.
            </p>
          </div>
        </div>

        <P>
          To test this directly in Figure A, switch the landscape selector to{' '}
          <strong className="text-text-primary">Two Wells and Saddle</strong>.
          Notice that starting on the left (<InlineCode>w = -1.8</InlineCode>) traps you in the local minimum,
          while starting on the right (<InlineCode>w = 1.8</InlineCode>) rolls into the deeper global minimum.
        </P>
      </Reveal>

      {/* 9. Key Takeaways */}
      <Reveal direction="up" delay={0.05}>
        <Callout variant="takeaway" title="Key Takeaways">
          Gradient descent turns calculus derivatives into parameter updates.
          The learning rate controls whether you crawl, converge, oscillate, or diverge.
          In ravines and noisy batches, momentum accelerates progress along flat dimensions
          while damping cross-valley bounces.
        </Callout>
      </Reveal>
    </SectionWrapper>
  );
}
