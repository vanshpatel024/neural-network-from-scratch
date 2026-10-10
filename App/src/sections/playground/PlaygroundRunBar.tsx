import { Play, Pause, SkipForward, RotateCcw, Dices } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';

interface PlaygroundRunBarProps {
  isTraining: boolean;
  containerWidth: number;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onRandomizeSeed: () => void;
}

export function PlaygroundRunBar({
  isTraining,
  containerWidth,
  onStart,
  onPause,
  onStep,
  onReset,
  onRandomizeSeed,
}: PlaygroundRunBarProps): JSX.Element {
  // Show text labels when container is wide (>= 520px)
  const isCompact = containerWidth > 0 && containerWidth < 520;

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Primary Train / Pause Button */}
      <button
        type="button"
        onClick={isTraining ? onPause : onStart}
        aria-label={isTraining ? 'Pause training' : 'Start training'}
        className={`flex-1 min-h-[40px] px-4 py-2 rounded-lg font-semibold text-caption inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
          isTraining
            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
            : 'bg-accent hover:bg-accent-light text-white shadow-accent/20'
        }`}
      >
        {isTraining ? (
          <>
            <Pause className="w-4 h-4 fill-current shrink-0" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>Train</span>
          </>
        )}
      </button>

      {/* Step one epoch */}
      <Tooltip content="Step one epoch">
        <button
          type="button"
          onClick={onStep}
          disabled={isTraining}
          aria-label="Step one epoch"
          className="min-h-[40px] px-3 py-2 rounded-lg font-medium text-caption bg-surface hover:bg-hover text-text-primary border border-border-subtle inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-4 h-4 shrink-0" />
          {!isCompact && <span>Step</span>}
        </button>
      </Tooltip>

      {/* Reset weights */}
      <Tooltip content="Reset weights to initial state">
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset weights"
          className="min-h-[40px] px-3 py-2 rounded-lg font-medium text-caption bg-surface hover:bg-hover text-text-secondary hover:text-text-primary border border-border-subtle inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          {!isCompact && <span>Reset</span>}
        </button>
      </Tooltip>

      {/* New seed */}
      <Tooltip content="Generate new random seed">
        <button
          type="button"
          onClick={onRandomizeSeed}
          aria-label="New random seed"
          className="min-h-[40px] px-3 py-2 rounded-lg font-medium text-caption bg-surface hover:bg-hover text-text-secondary hover:text-text-primary border border-border-subtle inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Dices className="w-4 h-4 shrink-0" />
          {!isCompact && <span>Seed</span>}
        </button>
      </Tooltip>
    </div>
  );
}
