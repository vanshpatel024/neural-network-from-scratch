import { describe, it, expect } from 'vitest';
import { Value, computeScalarTrace, computeDigitClassificationTrace } from './autograd';

describe('Scalar Autograd Engine', () => {
  it('computes forward operations correctly', () => {
    const a = new Value(3);
    const b = new Value(-2);
    const c = a.mul(b); // -6
    const d = c.add(10); // 4
    const e = d.pow(2); // 16
    expect(e.data).toBe(16);
  });

  it('computes analytic gradients matching calculus for f = (a*b + c)^2', () => {
    // a = 2, b = -3, c = 10
    // u = -6, v = 4, f = 16
    // df/df = 1
    // df/dv = 2*v = 8
    // df/dc = 8 * 1 = 8
    // df/du = 8 * 1 = 8
    // df/da = 8 * b = -24
    // df/db = 8 * a = 16
    const a = new Value(2, [], '', 'a');
    const b = new Value(-3, [], '', 'b');
    const c = new Value(10, [], '', 'c');

    const u = a.mul(b);
    const v = u.add(c);
    const f = v.pow(2);

    f.backward();

    expect(f.data).toBe(16);
    expect(f.grad).toBe(1);
    expect(v.grad).toBe(8);
    expect(c.grad).toBe(8);
    expect(u.grad).toBe(8);
    expect(a.grad).toBe(-24);
    expect(b.grad).toBe(16);
  });

  it('accumulates gradients correctly when a variable branches into multiple paths', () => {
    // y = x * x + x => dy/dx = 2*x + 1
    // For x = 3: y = 9 + 3 = 12, dy/dx = 2*3 + 1 = 7
    const x = new Value(3);
    const xSquared = x.mul(x);
    const y = xSquared.add(x);

    y.backward();

    expect(y.data).toBe(12);
    expect(x.grad).toBe(7);
  });

  it('generates complete scalar trace with valid forward and backward steps', () => {
    const trace = computeScalarTrace(2, -3, 10);
    expect(trace.nodes.f?.data).toBe(16);
    expect(trace.nodes.a?.grad).toBe(-24);
    expect(trace.nodes.b?.grad).toBe(16);
    expect(trace.nodes.c?.grad).toBe(8);

    expect(trace.forwardSteps.length).toBe(3);
    expect(trace.backwardSteps.length).toBe(6);
  });

  it('computes digit classification trace matching calculus and BCE loss', () => {
    // x = 1.0, w = 2.0, b = -1.0, y = 1
    // z = 2*1 - 1 = 1.0
    // yHat = sigmoid(1.0) ~= 0.7310585786
    // loss = -ln(0.7310585786) ~= 0.3132616875
    // dL/dz = yHat - y = 0.7310585786 - 1 = -0.2689414214
    // dL/dw = dL/dz * x = -0.2689414214
    // dL/db = dL/dz * 1 = -0.2689414214
    const trace = computeDigitClassificationTrace(1.0, 2.0, -1.0, 1);

    expect(trace.nodes.z?.data).toBeCloseTo(1.0, 4);
    expect(trace.nodes.yHat?.data).toBeCloseTo(0.7311, 3);
    expect(trace.nodes.loss?.data).toBeCloseTo(0.3133, 3);

    expect(trace.nodes.z?.grad).toBeCloseTo(-0.2689, 3);
    expect(trace.nodes.w?.grad).toBeCloseTo(-0.2689, 3);
    expect(trace.nodes.b?.grad).toBeCloseTo(-0.2689, 3);

    expect(trace.forwardSteps.length).toBe(3);
    expect(trace.backwardSteps.length).toBe(5);
  });
});
