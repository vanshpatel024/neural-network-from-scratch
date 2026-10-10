import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface LossPoint {
  step: number;
  loss: number;
}

export interface LossChartProps {
  data: readonly LossPoint[];
}

export function LossChart({ data }: LossChartProps): JSX.Element {
  // Format data for chart display, capping infinite values gracefully
  const chartData = data.map((d) => {
    const isFiniteVal = Number.isFinite(d.loss);
    return {
      step: d.step,
      loss: isFiniteVal ? parseFloat(d.loss.toFixed(4)) : 99.99,
      isDiverged: !isFiniteVal,
    };
  });

  return (
    <div className="w-full rounded-xl border border-border-subtle bg-surface p-4">
      <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="text-label text-text-muted">
          Loss Curve: f(w) per Iteration
        </div>
        <div className="text-caption text-text-secondary font-mono">
          Steps: {data.length > 0 ? data.length - 1 : 0}
        </div>
      </div>

      <div className="h-52 w-full">
        {chartData.length <= 1 ? (
          <div className="flex h-full items-center justify-center text-caption text-text-muted">
            Press Play or Step to watch the loss drop per iteration.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                stroke="#27272a"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="step"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const firstPayload = payload[0];
                  if (!firstPayload) return null;
                  const item = firstPayload.payload as {
                    step: number;
                    loss: number;
                    isDiverged: boolean;
                  };
                  return (
                    <div className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-caption shadow-xl">
                      <div className="text-text-muted">Step {item.step}</div>
                      <div className="font-mono font-semibold text-accent">
                        {item.isDiverged ? 'Diverged (∞)' : `Loss: ${item.loss}`}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="loss"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5, fill: '#60a5fa' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
