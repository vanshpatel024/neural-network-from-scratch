import type { KeyboardEvent } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import type { UsePlaybackReturn } from '@/hooks/usePlayback';
import { Tooltip } from './Tooltip';

export interface PlaybackControlsProps {
  playback: UsePlaybackReturn;
  speedOptions?: readonly number[];
  label?: string;
  className?: string;
}

export function PlaybackControls({
  playback,
  speedOptions = [1, 2, 5, 10],
  label,
  className = '',
}: PlaybackControlsProps): JSX.Element {
  const { isPlaying, togglePlay, step, reset, tickCount, speed, setSpeed } =
    playback;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!isPlaying) step();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      reset();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface/90 px-4 py-2.5 ${className}`}
    >
      {/* Control Buttons */}
      <div className="flex items-center gap-1.5">
        <Tooltip
          content={isPlaying ? 'Pause' : 'Play'}
          shortcut="Space"
        >
          <button
            type="button"
            onClick={togglePlay}
            aria-label={
              isPlaying ? 'Pause (Space)' : 'Play (Space)'
            }
            className={`flex h-8 w-8 items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isPlaying
                ? 'bg-accent text-white hover:bg-accent-dark'
                : 'border border-border-subtle bg-elevated text-text-primary hover:border-border-strong hover:bg-hover'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>
        </Tooltip>

        <Tooltip content="Next step" shortcut="→">
          <button
            type="button"
            onClick={step}
            disabled={isPlaying}
            aria-label="Next step (Right Arrow)"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip content="Reset" shortcut="R">
          <button
            type="button"
            onClick={reset}
            aria-label="Reset (R)"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-elevated text-text-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-2">
        <span className="text-label text-text-muted">
          Speed:
        </span>
        <div className="flex items-center rounded-md border border-border-subtle bg-elevated p-0.5">
          {speedOptions.map((s) => {
            const isSelected = speed === s;
            return (
              <Tooltip key={s} content={`${s}x speed`}>
                <button
                  type="button"
                  aria-label={`${s}x speed`}
                  onClick={() => setSpeed(s)}
                  className={`rounded px-2 py-0.5 text-code-sm transition-colors ${
                    isSelected
                      ? 'bg-accent text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}x
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Step / Tick Readout */}
      <div className="flex items-center gap-2">
        {label && (
          <span className="text-caption text-text-secondary font-medium">
            {label}
          </span>
        )}
        <span className="text-code-sm tabular-nums text-accent rounded border border-border-subtle bg-elevated px-2 py-0.5">
          Step: {tickCount}
        </span>
      </div>
    </div>
  );
}
