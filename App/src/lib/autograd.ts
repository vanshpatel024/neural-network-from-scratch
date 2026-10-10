/**
 * Lightweight scalar autograd engine designed for educational visualization.
 * Kept separate from the production vector neural network engine.
 */

export class Value {
  public data: number;
  public grad: number;
  public op: string;
  public label?: string;
  public prev: Set<Value>;
  public _backward: () => void;

  constructor(data: number, children: Value[] = [], op = '', label?: string) {
    this.data = data;
    this.grad = 0;
    this.op = op;
    this.label = label;
    this.prev = new Set(children);
    this._backward = () => {};
  }

  public add(other: Value | number): Value {
    const o = other instanceof Value ? other : new Value(other);
    const out = new Value(this.data + o.data, [this, o], '+');

    out._backward = () => {
      this.grad += 1.0 * out.grad;
      o.grad += 1.0 * out.grad;
    };

    return out;
  }

  public mul(other: Value | number): Value {
    const o = other instanceof Value ? other : new Value(other);
    const out = new Value(this.data * o.data, [this, o], '*');

    out._backward = () => {
      this.grad += o.data * out.grad;
      o.grad += this.data * out.grad;
    };

    return out;
  }

  public pow(exponent: number): Value {
    const out = new Value(Math.pow(this.data, exponent), [this], `^${exponent}`);

    out._backward = () => {
      this.grad += exponent * Math.pow(this.data, exponent - 1) * out.grad;
    };

    return out;
  }

  public sub(other: Value | number): Value {
    const o = other instanceof Value ? other : new Value(other);
    const out = new Value(this.data - o.data, [this, o], '-');

    out._backward = () => {
      this.grad += 1.0 * out.grad;
      o.grad += -1.0 * out.grad;
    };

    return out;
  }

  public neg(): Value {
    return this.mul(-1);
  }

  public backward(): void {
    // Topological sorting of graph nodes
    const topo: Value[] = [];
    const visited = new Set<Value>();

    const buildTopo = (v: Value): void => {
      if (!visited.has(v)) {
        visited.add(v);
        for (const child of v.prev) {
          buildTopo(child);
        }
        topo.push(v);
      }
    };

    buildTopo(this);

    this.grad = 1.0;
    for (let i = topo.length - 1; i >= 0; i--) {
      const node = topo[i];
      if (node) {
        node._backward();
      }
    }
  }
}

/**
 * Concrete scalar expression trace for f = (a * b + c)^2
 * Used by the interactive computation graph visualizer.
 */
export interface TraceNode {
  id: 'a' | 'b' | 'c' | 'u' | 'v' | 'f';
  label: string;
  data: number;
  grad: number;
  op?: string;
  expr: string;
}

export interface TraceStep {
  stepIndex: number;
  phase: 'idle' | 'forward' | 'backward';
  activeNodeId: 'a' | 'b' | 'c' | 'u' | 'v' | 'f';
  title: string;
  symbolicEquation: string;
  evaluatedEquation: string;
  localDerivative: string;
  explanation: string;
  incomingGradSymbol?: string;
  incomingGradValue?: string;
  incomingGradExplanation?: string;
  localDerivSymbol?: string;
  localDerivValue?: string;
  localDerivExplanation?: string;
  intuitionTakeaway: string;
}

export function computeScalarTrace(
  aVal: number,
  bVal: number,
  cVal: number
): {
  nodes: Record<string, TraceNode>;
  forwardSteps: TraceStep[];
  backwardSteps: TraceStep[];
} {
  const a = new Value(aVal, [], '', 'a');
  const b = new Value(bVal, [], '', 'b');
  const c = new Value(cVal, [], '', 'c');

  const u = a.mul(b);
  u.label = 'u';

  const v = u.add(c);
  v.label = 'v';

  const f = v.pow(2);
  f.label = 'f';

  f.backward();

  const nodes: Record<string, TraceNode> = {
    a: { id: 'a', label: 'a', data: a.data, grad: a.grad, expr: 'input' },
    b: { id: 'b', label: 'b', data: b.data, grad: b.grad, expr: 'input' },
    c: { id: 'c', label: 'c', data: c.data, grad: c.grad, expr: 'input' },
    u: { id: 'u', label: 'u', data: u.data, grad: u.grad, op: '×', expr: 'a * b' },
    v: { id: 'v', label: 'v', data: v.data, grad: v.grad, op: '+', expr: 'u + c' },
    f: { id: 'f', label: 'f', data: f.data, grad: f.grad, op: '(·)²', expr: 'v^2' },
  };

  const forwardSteps: TraceStep[] = [
    {
      stepIndex: 1,
      phase: 'forward',
      activeNodeId: 'u',
      title: 'Compute Product u = a · b',
      symbolicEquation: 'u = a \\cdot b',
      evaluatedEquation: `u = (${aVal.toFixed(1)}) \\cdot (${bVal.toFixed(1)}) = ${u.data.toFixed(2)}`,
      localDerivative: '\\frac{\\partial u}{\\partial a} = b, \\quad \\frac{\\partial u}{\\partial b} = a',
      explanation: 'Multiplies input a by input b to compute intermediate product u.',
      intuitionTakeaway: 'Data flows left to right. Intermediate node u caches this number for both downstream calculations and the backward pass.',
    },
    {
      stepIndex: 2,
      phase: 'forward',
      activeNodeId: 'v',
      title: 'Compute Sum v = u + c',
      symbolicEquation: 'v = u + c',
      evaluatedEquation: `v = (${u.data.toFixed(2)}) + (${cVal.toFixed(1)}) = ${v.data.toFixed(2)}`,
      localDerivative: '\\frac{\\partial v}{\\partial u} = 1, \\quad \\frac{\\partial v}{\\partial c} = 1',
      explanation: 'Adds constant input c to product u to compute sum v.',
      intuitionTakeaway: 'The addition operator combines product u and input c into a single value.',
    },
    {
      stepIndex: 3,
      phase: 'forward',
      activeNodeId: 'f',
      title: 'Compute Output f = v²',
      symbolicEquation: 'f = v^2',
      evaluatedEquation: `f = (${v.data.toFixed(2)})^2 = ${f.data.toFixed(2)}`,
      localDerivative: '\\frac{\\partial f}{\\partial v} = 2v',
      explanation: 'Squares value v to produce final output f.',
      intuitionTakeaway: 'Forward pass is now complete. Next, backpropagation walks in reverse to compute all parameter sensitivities.',
    },
  ];

  const df_dv = 2 * v.data;
  const backwardSteps: TraceStep[] = [
    {
      stepIndex: 4,
      phase: 'backward',
      activeNodeId: 'f',
      title: 'Output Base Derivative',
      symbolicEquation: '\\frac{\\partial f}{\\partial f} = 1',
      evaluatedEquation: '\\frac{\\partial f}{\\partial f} = 1.0',
      localDerivative: '1.0',
      explanation: 'Rate of change of output f with respect to itself is always 1.',
      incomingGradSymbol: '\\frac{\\partial f}{\\partial f}',
      incomingGradValue: '1.0',
      incomingGradExplanation: 'Base starting signal that initiates backpropagation.',
      localDerivSymbol: '\\frac{\\partial f}{\\partial f}',
      localDerivValue: '1.0',
      localDerivExplanation: 'Any variable has a rate of change of 1.0 with respect to itself.',
      intuitionTakeaway: 'Backpropagation always starts at the final output with a seed gradient of 1.0.',
    },
    {
      stepIndex: 5,
      phase: 'backward',
      activeNodeId: 'v',
      title: 'Propagate through Square to v',
      symbolicEquation: '\\frac{\\partial f}{\\partial v} = \\frac{\\partial f}{\\partial f} \\cdot 2v',
      evaluatedEquation: `\\frac{\\partial f}{\\partial v} = (1.0) \\cdot 2(${v.data.toFixed(2)}) = ${v.grad.toFixed(2)}`,
      localDerivative: `2v = ${df_dv.toFixed(2)}`,
      explanation: 'Applies the power rule: the local derivative of v² is 2v.',
      incomingGradSymbol: '\\frac{\\partial f}{\\partial f}',
      incomingGradValue: '1.0',
      incomingGradExplanation: 'Incoming gradient from final output f.',
      localDerivSymbol: '\\frac{\\partial (v^2)}{\\partial v}',
      localDerivValue: `2v = ${df_dv.toFixed(2)}`,
      localDerivExplanation: 'Power rule: d(v²)/dv = 2v.',
      intuitionTakeaway: `Because v = ${v.data.toFixed(2)}, changing v by 1 causes f to change by 2v = ${df_dv.toFixed(2)}.`,
    },
    {
      stepIndex: 6,
      phase: 'backward',
      activeNodeId: 'c',
      title: 'Propagate through Addition to c',
      symbolicEquation: '\\frac{\\partial f}{\\partial c} = \\frac{\\partial f}{\\partial v} \\cdot 1',
      evaluatedEquation: `\\frac{\\partial f}{\\partial c} = (${v.grad.toFixed(2)}) \\cdot 1.0 = ${c.grad.toFixed(2)}`,
      localDerivative: '1.0',
      explanation: 'Addition rule passes incoming gradient directly with local derivative 1.',
      incomingGradSymbol: '\\frac{\\partial f}{\\partial v}',
      incomingGradValue: `${v.grad.toFixed(2)}`,
      incomingGradExplanation: 'Incoming gradient from sum node v.',
      localDerivSymbol: '\\frac{\\partial (u+c)}{\\partial c}',
      localDerivValue: '1.0',
      localDerivExplanation: 'Derivative of a sum with respect to c is 1.',
      intuitionTakeaway: 'Addition nodes act as distributors. The entire gradient flows to input c without diminishing.',
    },
    {
      stepIndex: 7,
      phase: 'backward',
      activeNodeId: 'u',
      title: 'Propagate through Addition to u',
      symbolicEquation: '\\frac{\\partial f}{\\partial u} = \\frac{\\partial f}{\\partial v} \\cdot 1',
      evaluatedEquation: `\\frac{\\partial f}{\\partial u} = (${v.grad.toFixed(2)}) \\cdot 1.0 = ${u.grad.toFixed(2)}`,
      localDerivative: '1.0',
      explanation: 'Addition rule passes incoming gradient directly with local derivative 1.',
      incomingGradSymbol: '\\frac{\\partial f}{\\partial v}',
      incomingGradValue: `${v.grad.toFixed(2)}`,
      incomingGradExplanation: 'Incoming gradient from sum node v.',
      localDerivSymbol: '\\frac{\\partial (u+c)}{\\partial u}',
      localDerivValue: '1.0',
      localDerivExplanation: 'Derivative of a sum with respect to u is 1.',
      intuitionTakeaway: 'Just like c, product node u receives the full gradient of 8.0 directly through the addition gate.',
    },
    {
      stepIndex: 8,
      phase: 'backward',
      activeNodeId: 'b',
      title: 'Propagate through Product to b',
      symbolicEquation: '\\frac{\\partial f}{\\partial b} = \\frac{\\partial f}{\\partial u} \\cdot a',
      evaluatedEquation: `\\frac{\\partial f}{\\partial b} = (${u.grad.toFixed(2)}) \\cdot (${aVal.toFixed(1)}) = ${b.grad.toFixed(2)}`,
      localDerivative: `a = ${aVal.toFixed(2)}`,
      explanation: 'Product rule scales incoming gradient by the other factor a.',
      incomingGradSymbol: '\\frac{\\partial f}{\\partial u}',
      incomingGradValue: `${u.grad.toFixed(2)}`,
      incomingGradExplanation: 'Incoming gradient from product node u.',
      localDerivSymbol: '\\frac{\\partial (a \\cdot b)}{\\partial b}',
      localDerivValue: `a = ${aVal.toFixed(2)}`,
      localDerivExplanation: 'Product rule: local derivative with respect to b is a.',
      intuitionTakeaway: `Product nodes swap multipliers: the sensitivity of output to b is scaled by input a (${aVal.toFixed(2)}).`,
    },
    {
      stepIndex: 9,
      phase: 'backward',
      activeNodeId: 'a',
      title: 'Propagate through Product to a',
      symbolicEquation: '\\frac{\\partial f}{\\partial a} = \\frac{\\partial f}{\\partial u} \\cdot b',
      evaluatedEquation: `\\frac{\\partial f}{\\partial a} = (${u.grad.toFixed(2)}) \\cdot (${bVal.toFixed(1)}) = ${a.grad.toFixed(2)}`,
      localDerivative: `b = ${bVal.toFixed(2)}`,
      explanation: 'Product rule scales incoming gradient by the other factor b.',
      incomingGradSymbol: '\\frac{\\partial f}{\\partial u}',
      incomingGradValue: `${u.grad.toFixed(2)}`,
      incomingGradExplanation: 'Incoming gradient from product node u.',
      localDerivSymbol: '\\frac{\\partial (a \\cdot b)}{\\partial a}',
      localDerivValue: `b = ${bVal.toFixed(2)}`,
      localDerivExplanation: 'Product rule: local derivative with respect to a is b.',
      intuitionTakeaway: `The sensitivity of output to a is scaled by input b (${bVal.toFixed(2)}). Because b is negative, increasing a lowers output f.`,
    },
  ];

  return { nodes, forwardSteps, backwardSteps };
}

/**
 * Computation graph trace for binary digit classification:
 * z = w * x + b
 * yHat = sigmoid(z)
 * Loss = BCE(yHat, y)
 */
export interface DigitTraceNode {
  id: 'x' | 'w' | 'b' | 'z' | 'yHat' | 'y' | 'loss';
  label: string;
  data: number;
  grad: number;
  op?: string;
  expr: string;
  unit?: string;
}

export interface DigitTraceStep {
  stepIndex: number;
  phase: 'idle' | 'forward' | 'backward';
  activeNodeId: 'x' | 'w' | 'b' | 'z' | 'yHat' | 'y' | 'loss';
  title: string;
  symbolicEquation: string;
  evaluatedEquation: string;
  localDerivative: string;
  explanation: string;
  incomingGradSymbol?: string;
  incomingGradValue?: string;
  incomingGradExplanation?: string;
  localDerivSymbol?: string;
  localDerivValue?: string;
  localDerivExplanation?: string;
  intuitionTakeaway: string;
}

export function computeDigitClassificationTrace(
  xVal: number,
  wVal: number,
  bVal: number,
  targetY: 0 | 1
): {
  nodes: Record<string, DigitTraceNode>;
  forwardSteps: DigitTraceStep[];
  backwardSteps: DigitTraceStep[];
} {
  const z = wVal * xVal + bVal;
  const yHat = 1 / (1 + Math.exp(-z));
  const eps = 1e-7;
  const clampedYHat = Math.max(eps, Math.min(1 - eps, yHat));
  const loss = -(
    targetY * Math.log(clampedYHat) +
    (1 - targetY) * Math.log(1 - clampedYHat)
  );

  const dL_dL = 1.0;
  const dL_dyHat = (clampedYHat - targetY) / (clampedYHat * (1 - clampedYHat));
  const dyHat_dz = clampedYHat * (1 - clampedYHat);
  const dL_dz = clampedYHat - targetY;
  const dL_db = dL_dz * 1.0;
  const dL_dw = dL_dz * xVal;
  const dL_dx = dL_dz * wVal;

  const nodes: Record<string, DigitTraceNode> = {
    x: { id: 'x', label: 'x', data: xVal, grad: dL_dx, expr: 'pixel', unit: 'input' },
    w: { id: 'w', label: 'w', data: wVal, grad: dL_dw, expr: 'weight', unit: 'param' },
    b: { id: 'b', label: 'b', data: bVal, grad: dL_db, expr: 'bias', unit: 'param' },
    z: { id: 'z', label: 'z', data: z, grad: dL_dz, op: 'w·x+b', expr: 'logit' },
    yHat: { id: 'yHat', label: 'ŷ', data: yHat, grad: dL_dyHat, op: 'σ(z)', expr: 'prob' },
    y: { id: 'y', label: 'y', data: targetY, grad: 0, expr: 'label', unit: 'target' },
    loss: { id: 'loss', label: 'Loss', data: loss, grad: dL_dL, op: 'BCE', expr: 'error' },
  };

  const forwardSteps: DigitTraceStep[] = [
    {
      stepIndex: 1,
      phase: 'forward',
      activeNodeId: 'z',
      title: 'Compute Linear Score z = w · x + b',
      symbolicEquation: 'z = w \\cdot x + b',
      evaluatedEquation: `z = (${wVal.toFixed(2)}) \\cdot (${xVal.toFixed(2)}) + (${bVal.toFixed(2)}) = ${z.toFixed(2)}`,
      localDerivative: '\\frac{\\partial z}{\\partial w} = x, \\quad \\frac{\\partial z}{\\partial b} = 1',
      explanation: 'Multiplies input pixel x by synaptic weight w, then adds bias b.',
      intuitionTakeaway: 'Linear combination aggregates evidence before the non-linear activation.',
    },
    {
      stepIndex: 2,
      phase: 'forward',
      activeNodeId: 'yHat',
      title: 'Compute Prediction ŷ = σ(z)',
      symbolicEquation: '\\hat{y} = \\sigma(z) = \\frac{1}{1 + e^{-z}}',
      evaluatedEquation: `\\hat{y} = \\frac{1}{1 + e^{-(${z.toFixed(2)})}} = ${yHat.toFixed(3)}`,
      localDerivative: '\\frac{\\partial \\hat{y}}{\\partial z} = \\hat{y}(1 - \\hat{y})',
      explanation: 'Sigmoid squashes the unbounded logit score into a probability between 0 and 1.',
      intuitionTakeaway: `The neuron outputs a ${(yHat * 100).toFixed(1)}% probability that this image is digit 1.`,
    },
    {
      stepIndex: 3,
      phase: 'forward',
      activeNodeId: 'loss',
      title: 'Compute Binary Cross-Entropy Loss',
      symbolicEquation: 'L = -[y \\ln(\\hat{y}) + (1 - y) \\ln(1 - \\hat{y})]',
      evaluatedEquation: `L = -[(${targetY}) \\ln(${clampedYHat.toFixed(2)}) + (1 - ${targetY}) \\ln(1 - ${clampedYHat.toFixed(2)})] = ${loss.toFixed(3)}`,
      localDerivative: '\\frac{\\partial L}{\\partial \\hat{y}} = \\frac{\\hat{y} - y}{\\hat{y}(1 - \\hat{y})}',
      explanation: `Compares prediction ŷ against the ground truth label y = ${targetY}.`,
      intuitionTakeaway: targetY === 1
        ? 'Because true label is 1, loss penalizes low probability predictions.'
        : 'Because true label is 0, loss penalizes high probability predictions.',
    },
  ];

  const backwardSteps: DigitTraceStep[] = [
    {
      stepIndex: 4,
      phase: 'backward',
      activeNodeId: 'loss',
      title: 'Seed Gradient at Loss',
      symbolicEquation: '\\frac{\\partial L}{\\partial L} = 1.0',
      evaluatedEquation: '\\frac{\\partial L}{\\partial L} = 1.0',
      localDerivative: '1.0',
      explanation: 'Backpropagation initiates at the final loss with a seed signal of 1.0.',
      incomingGradSymbol: '\\frac{\\partial L}{\\partial L}',
      incomingGradValue: '1.0',
      incomingGradExplanation: 'Base starting derivative initiating the reverse chain rule.',
      localDerivSymbol: '\\frac{\\partial L}{\\partial L}',
      localDerivValue: '1.0',
      localDerivExplanation: 'Any variable has a rate of change of 1.0 with respect to itself.',
      intuitionTakeaway: 'Backpropagation begins at classification loss and steps backward to find parameter blame.',
    },
    {
      stepIndex: 5,
      phase: 'backward',
      activeNodeId: 'yHat',
      title: 'Propagate Loss Error to Prediction ŷ',
      symbolicEquation: '\\frac{\\partial L}{\\partial \\hat{y}} = \\frac{\\hat{y} - y}{\\hat{y}(1 - \\hat{y})}',
      evaluatedEquation: `\\frac{\\partial L}{\\partial \\hat{y}} = \\frac{${clampedYHat.toFixed(2)} - ${targetY}}{${clampedYHat.toFixed(2)}(1 - ${clampedYHat.toFixed(2)})} = ${dL_dyHat.toFixed(2)}`,
      localDerivative: `\\frac{${clampedYHat.toFixed(2)} - ${targetY}}{${(clampedYHat * (1 - clampedYHat)).toFixed(2)}}`,
      explanation: 'Quantifies how shifting prediction probability changes the total loss.',
      incomingGradSymbol: '\\frac{\\partial L}{\\partial L}',
      incomingGradValue: '1.0',
      incomingGradExplanation: 'Incoming gradient from loss node.',
      localDerivSymbol: '\\frac{\\partial L}{\\partial \\hat{y}}',
      localDerivValue: `${dL_dyHat.toFixed(2)}`,
      localDerivExplanation: 'Derivative of binary cross-entropy with respect to probability ŷ.',
      intuitionTakeaway: 'This derivative grows largest when the model is confident and wrong.',
    },
    {
      stepIndex: 6,
      phase: 'backward',
      activeNodeId: 'z',
      title: 'Propagate Through Sigmoid: Net Error Residual',
      symbolicEquation: '\\frac{\\partial L}{\\partial z} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\sigma\'(z) = \\hat{y} - y',
      evaluatedEquation: `\\frac{\\partial L}{\\partial z} = (${dL_dyHat.toFixed(2)}) \\cdot (${dyHat_dz.toFixed(2)}) = ${dL_dz.toFixed(2)}`,
      localDerivative: `\\hat{y}(1 - \\hat{y}) = ${dyHat_dz.toFixed(2)}`,
      explanation: 'Sigmoid slope cancels the loss denominator, leaving clean error: ŷ - y.',
      incomingGradSymbol: '\\frac{\\partial L}{\\partial \\hat{y}}',
      incomingGradValue: `${dL_dyHat.toFixed(2)}`,
      incomingGradExplanation: 'Incoming gradient from probability node ŷ.',
      localDerivSymbol: '\\frac{\\partial \\hat{y}}{\\partial z}',
      localDerivValue: `${dyHat_dz.toFixed(2)}`,
      localDerivExplanation: 'Local derivative of sigmoid: σ\'(z) = ŷ(1 - ŷ).',
      intuitionTakeaway: `Net error is prediction minus target: (${clampedYHat.toFixed(2)} - ${targetY}) = ${dL_dz.toFixed(2)}.`,
    },
    {
      stepIndex: 7,
      phase: 'backward',
      activeNodeId: 'b',
      title: 'Propagate to Bias b',
      symbolicEquation: '\\frac{\\partial L}{\\partial b} = \\frac{\\partial L}{\\partial z} \\cdot 1 = \\hat{y} - y',
      evaluatedEquation: `\\frac{\\partial L}{\\partial b} = (${dL_dz.toFixed(2)}) \\cdot 1.0 = ${dL_db.toFixed(2)}`,
      localDerivative: '1.0',
      explanation: 'Addition gate passes the error residual directly to bias b.',
      incomingGradSymbol: '\\frac{\\partial L}{\\partial z}',
      incomingGradValue: `${dL_dz.toFixed(2)}`,
      incomingGradExplanation: 'Incoming net error residual from logit node z.',
      localDerivSymbol: '\\frac{\\partial z}{\\partial b}',
      localDerivValue: '1.0',
      localDerivExplanation: 'Derivative of linear sum with respect to bias is 1.0.',
      intuitionTakeaway: dL_db > 0
        ? 'Positive gradient means bias was too high. Gradient descent lowers bias.'
        : 'Negative gradient means bias was too low. Gradient descent raises bias.',
    },
    {
      stepIndex: 8,
      phase: 'backward',
      activeNodeId: 'w',
      title: 'Propagate to Weight w',
      symbolicEquation: '\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial z} \\cdot x = (\\hat{y} - y) \\cdot x',
      evaluatedEquation: `\\frac{\\partial L}{\\partial w} = (${dL_dz.toFixed(2)}) \\cdot (${xVal.toFixed(2)}) = ${dL_dw.toFixed(2)}`,
      localDerivative: `x = ${xVal.toFixed(2)}`,
      explanation: 'Product rule scales the net error residual by active pixel intensity x.',
      incomingGradSymbol: '\\frac{\\partial L}{\\partial z}',
      incomingGradValue: `${dL_dz.toFixed(2)}`,
      incomingGradExplanation: 'Incoming net error residual from logit node z.',
      localDerivSymbol: '\\frac{\\partial z}{\\partial w}',
      localDerivValue: `x = ${xVal.toFixed(2)}`,
      localDerivExplanation: 'Derivative of linear sum with respect to weight is pixel x.',
      intuitionTakeaway: Math.abs(xVal) < 0.05
        ? 'Pixel is blank (near 0), so this weight receives almost zero gradient update.'
        : dL_dw > 0
          ? 'Positive gradient: reducing weight lowers prediction towards target 0.'
          : 'Negative gradient: increasing weight raises prediction towards target 1.',
    },
  ];

  return { nodes, forwardSteps, backwardSteps };
}
