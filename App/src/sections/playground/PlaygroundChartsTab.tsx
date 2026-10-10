import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HistoryPoint } from '../../store/playgroundStore';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

interface PlaygroundChartsTabProps {
  history: HistoryPoint[];
  activeChart: 'loss' | 'accuracy';
  onSetActiveChart: (chart: 'loss' | 'accuracy') => void;
}

export function PlaygroundChartsTab({
  history,
  activeChart,
  onSetActiveChart,
}: PlaygroundChartsTabProps): JSX.Element {
  const isLoss = activeChart === 'loss';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Chart Selector Segmented Control */}
      <div className="flex items-center justify-between px-1">
        <span className="text-caption text-text-secondary font-medium">
          Metric:
        </span>
        <SegmentedControl<'loss' | 'accuracy'>
          size="sm"
          options={[
            { value: 'loss', label: 'Loss Curve' },
            { value: 'accuracy', label: 'Accuracy Curve' },
          ]}
          value={activeChart}
          onChange={onSetActiveChart}
        />
      </div>

      {/* Reserved Chart Container (Fixed height to prevent any layout shift) */}
      <div className="h-64 sm:h-72 w-full rounded-xl border border-border-subtle bg-surface/50 p-2.5 flex flex-col justify-center">
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 12, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="epoch"
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis
                stroke={isLoss ? '#f59e0b' : '#10b981'}
                style={{ fontSize: '12px' }}
                tickLine={false}
                domain={isLoss ? [0, 'auto'] : [0, 100]}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121215',
                  borderColor: '#27272a',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#f4f4f5',
                }}
                itemStyle={{ padding: '0px' }}
              />
              <Line
                type="monotone"
                dataKey={isLoss ? 'loss' : 'accuracy'}
                name={isLoss ? 'BCE Loss' : 'Accuracy (%)'}
                stroke={isLoss ? '#f59e0b' : '#10b981'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center text-caption text-text-muted text-center px-4">
            Train the model to see the curve.
          </div>
        )}
      </div>

      <div className="text-caption text-text-muted px-1">
        {isLoss
          ? 'Shows binary cross-entropy loss over training epochs.'
          : 'Shows prediction accuracy on training samples.'}
      </div>
    </div>
  );
}
