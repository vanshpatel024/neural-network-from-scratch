import { useEffect, useRef, useState } from 'react';
import type { HistoryPoint } from '../../store/playgroundStore';
import {
  detectTrainingStatus,
  type TrainingStateType,
} from '../../lib/trainingStatus';

interface PlaygroundMetricsProps {
  epoch: number;
  loss: number;
  accuracy: number;
  pointsCount: number;
  isTraining: boolean;
  history: HistoryPoint[];
  containerWidth: number;
}

export function PlaygroundMetrics({
  epoch,
  loss,
  accuracy,
  pointsCount,
  isTraining,
  history,
  containerWidth,
}: PlaygroundMetricsProps): JSX.Element {
  const isNarrow = containerWidth > 0 && containerWidth < 480;

  // Detect qualitative training state from rolling window
  const statusInfo = detectTrainingStatus(history, isTraining);

  // Announce via aria-live ONLY when state changes
  const lastStateRef = useRef<TrainingStateType>('idle');
  const [announcedMessage, setAnnouncedMessage] = useState<string>(
    statusInfo.message
  );

  useEffect(() => {
    if (statusInfo.state !== lastStateRef.current) {
      lastStateRef.current = statusInfo.state;
      setAnnouncedMessage(statusInfo.message);
    }
  }, [statusInfo.state, statusInfo.message]);

  const statusDotColor = {
    idle: 'bg-text-muted',
    learning: 'bg-accent',
    converged: 'bg-success',
    stuck: 'bg-warning',
    unstable: 'bg-danger',
  }[statusInfo.state];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* 4 Stats Cards */}
      <div
        className={`grid gap-2 w-full ${
          isNarrow ? 'grid-cols-2' : 'grid-cols-4'
        }`}
      >
        {/* Epoch */}
        <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 min-w-[70px] overflow-hidden">
          <div className="text-label text-text-muted truncate">Epoch</div>
          <div className="mt-0.5 text-code font-bold text-text-primary tabular-nums truncate">
            {epoch}
          </div>
        </div>

        {/* Loss */}
        <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 min-w-[70px] overflow-hidden">
          <div className="text-label text-text-muted truncate">Loss</div>
          <div className="mt-0.5 text-code font-bold text-warning tabular-nums truncate">
            {loss > 0 ? loss.toFixed(3) : '0.000'}
          </div>
        </div>

        {/* Accuracy */}
        <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 min-w-[70px] overflow-hidden">
          <div className="text-label text-text-muted truncate">Accuracy</div>
          <div className="mt-0.5 text-code font-bold text-success tabular-nums truncate">
            {accuracy.toFixed(1)}%
          </div>
        </div>

        {/* Points */}
        <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 min-w-[70px] overflow-hidden">
          <div className="text-label text-text-muted truncate">Points</div>
          <div className="mt-0.5 text-code font-bold text-accent-light tabular-nums truncate">
            {pointsCount}
          </div>
        </div>
      </div>

      {/* "What is happening" line (polite live region announced only on state change) */}
      <div className="flex items-center gap-2 px-1 text-caption text-text-secondary min-h-[22px]">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor} transition-colors`}
        />
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="truncate"
        >
          {announcedMessage}
        </div>
      </div>
    </div>
  );
}
