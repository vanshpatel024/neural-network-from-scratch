import { useState, useMemo } from 'react';
import { Sequential } from '@/lib/nn/sequential';
import { bceLoss } from '@/lib/nn/loss';
import { CheckCircle, AlertTriangle, Bug, Wrench, RefreshCw } from 'lucide-react';
import { Stat } from '@/components/ui/Stat';

interface ParamRow {
  paramName: string;
  layer: string;
  analytical: number;
  numerical: number;
  relativeError: number;
  passed: boolean;
  isCorrupted: boolean;
}

export function GradCheckVisualizer(): JSX.Element {
  const [injectBug, setInjectBug] = useState<boolean>(false);
  const [eps, setEps] = useState<number>(1e-5);
  const [seed, setSeed] = useState<number>(42);

  const THRESHOLD = 1e-7;

  // Run gradient checking on a small network
  const checkResult = useMemo(() => {
    // 2 inputs -> 3 hidden neurons -> 1 output
    const net = new Sequential({
      inputDim: 2,
      hiddenLayers: [3],
      outputDim: 1,
      activation: 'tanh',
      initType: 'xavier',
      seed,
    });

    // Fixed small dataset: 4 points
    const X = [
      [0.5, -0.2],
      [-0.8, 0.4],
      [0.3, 0.9],
      [-0.4, -0.6],
    ];
    const y = [[1], [0], [1], [0]];

    // 1. Analytical gradients via backprop
    net.forward(X);
    net.backward(y);

    // Deliberate bug injection: flip sign and corrupt gradient of W1[0][0]
    if (injectBug && net.layers[0]) {
      net.layers[0].gradWeights[0]![0]! *= -1.5;
    }

    let maxError = 0;
    const rows: ParamRow[] = [];

    // 2. Numerical gradients via centered differences: (L(w+eps) - L(w-eps))/(2*eps)
    for (let l = 0; l < net.layers.length; l++) {
      const layer = net.layers[l]!;
      const layerName = l === 0 ? 'Layer 1 (Hidden)' : 'Layer 2 (Output)';

      // Check weights
      for (let i = 0; i < layer.inputDim; i++) {
        for (let j = 0; j < layer.outputDim; j++) {
          const originalVal = layer.weights[i]![j]!;
          const analyticalGrad = layer.gradWeights[i]![j]!;

          // theta + eps
          layer.weights[i]![j] = originalVal + eps;
          const lossPlus = bceLoss(net.forward(X), y);

          // theta - eps
          layer.weights[i]![j] = originalVal - eps;
          const lossMinus = bceLoss(net.forward(X), y);

          // restore
          layer.weights[i]![j] = originalVal;

          const numericalGrad = (lossPlus - lossMinus) / (2 * eps);
          const denominator = Math.max(
            Math.abs(analyticalGrad),
            Math.abs(numericalGrad),
            1e-8
          );
          const relError = Math.abs(analyticalGrad - numericalGrad) / denominator;

          if (relError > maxError) maxError = relError;

          const isCorrupted = injectBug && l === 0 && i === 0 && j === 0;
          rows.push({
            paramName: `W[${i},${j}]`,
            layer: layerName,
            analytical: analyticalGrad,
            numerical: numericalGrad,
            relativeError: relError,
            passed: relError < THRESHOLD,
            isCorrupted,
          });
        }
      }

      // Check biases
      for (let j = 0; j < layer.outputDim; j++) {
        const originalVal = layer.biases[j]!;
        const analyticalGrad = layer.gradBiases[j]!;

        // theta + eps
        layer.biases[j] = originalVal + eps;
        const lossPlus = bceLoss(net.forward(X), y);

        // theta - eps
        layer.biases[j] = originalVal - eps;
        const lossMinus = bceLoss(net.forward(X), y);

        // restore
        layer.biases[j] = originalVal;

        const numericalGrad = (lossPlus - lossMinus) / (2 * eps);
        const denominator = Math.max(
          Math.abs(analyticalGrad),
          Math.abs(numericalGrad),
          1e-8
        );
        const relError = Math.abs(analyticalGrad - numericalGrad) / denominator;

        if (relError > maxError) maxError = relError;

        rows.push({
          paramName: `b[${j}]`,
          layer: layerName,
          analytical: analyticalGrad,
          numerical: numericalGrad,
          relativeError: relError,
          passed: relError < THRESHOLD,
          isCorrupted: false,
        });
      }
    }

    return {
      maxRelativeError: maxError,
      passed: maxError < THRESHOLD,
      rows,
    };
  }, [injectBug, eps, seed]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 w-full">
      {/* Top Controls: Bug Injection & Epsilon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!injectBug ? (
            <button
              type="button"
              onClick={() => setInjectBug(true)}
              className="px-3 py-1.5 rounded-lg border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 font-medium text-caption inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Inject Backprop Bug</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setInjectBug(false)}
              className="px-3 py-1.5 rounded-lg border border-success/40 bg-success/10 text-success hover:bg-success/20 font-medium text-caption inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Fix Bug (Restore Backprop)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-elevated/60 text-text-secondary hover:text-text-primary text-caption inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Randomize Weights</span>
          </button>
        </div>

        {/* Epsilon Selector */}
        <div className="flex items-center gap-1.5 text-caption">
          <span className="text-text-muted">Step size ε:</span>
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border-subtle bg-elevated/70">
            {[1e-4, 1e-5, 1e-6].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setEps(val)}
                className={`px-2 py-0.5 font-mono text-[11px] rounded transition-colors cursor-pointer ${
                  eps === val
                    ? 'bg-surface text-text-primary shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {val.toExponential()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Status Banner */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
          checkResult.passed
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {checkResult.passed ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <div>
            <div className="font-semibold text-body-sm">
              {checkResult.passed
                ? 'Check passed. Backprop formulas are correct.'
                : 'Check failed. Found an error in backprop.'}
            </div>
            <div className="text-caption text-text-secondary mt-0.5">
              {checkResult.passed
                ? 'Calculated slopes match simple step estimates within safe limits.'
                : 'Calculated slopes do not match step estimates. Check your formulas.'}
            </div>
          </div>
        </div>

        {/* Readout stats */}
        <div className="flex items-center gap-4 shrink-0">
          <Stat
            label="Max Relative Error"
            value={checkResult.maxRelativeError.toExponential(2)}
          />
          <Stat label="Pass Threshold" value={THRESHOLD.toExponential(0)} />
        </div>
      </div>

      {/* Detailed Parameters Table */}
      <div className="rounded-xl border border-border-subtle bg-elevated/30 overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-border-subtle bg-surface/70 flex items-center justify-between text-caption">
          <span className="font-semibold text-text-primary">
            Comparing slopes for all 13 weights and biases
          </span>
          <span className="text-text-muted font-mono text-[11px]">
            Relative error: difference divided by slope size
          </span>
        </div>

        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left border-collapse text-caption font-mono">
            <thead>
              <tr className="border-b border-border-subtle bg-elevated/60 text-text-muted text-[11px]">
                <th className="py-2 px-3">Weight</th>
                <th className="py-2 px-3">Layer</th>
                <th className="py-2 px-3 text-right">Backprop</th>
                <th className="py-2 px-3 text-right">Step Estimate</th>
                <th className="py-2 px-3 text-right">Error</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60 text-text-secondary text-[11px]">
              {checkResult.rows.map((row, idx) => (
                <tr
                  key={`param-${idx}`}
                  className={`transition-colors ${
                    row.isCorrupted
                      ? 'bg-danger/20 text-danger font-semibold'
                      : !row.passed
                      ? 'bg-danger/10 text-danger'
                      : 'hover:bg-hover/50'
                  }`}
                >
                  <td className="py-1.5 px-3 font-semibold text-text-primary">
                    {row.paramName}
                    {row.isCorrupted && (
                      <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-danger text-white">
                        BUG
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 font-sans text-text-muted text-[11px]">
                    {row.layer}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {row.analytical.toFixed(5)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {row.numerical.toFixed(5)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {row.relativeError.toExponential(2)}
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    {row.passed ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-success/15 text-success">
                        PASS
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-danger/20 text-danger">
                        FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GradCheckVisualizer;
