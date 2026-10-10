import { usePlaygroundStore, PRESETS, type PresetStory } from '../../store/playgroundStore';
import { RotateCcw } from 'lucide-react';

interface PlaygroundPresetsStripProps {
  onApplyPreset: (preset: PresetStory) => void;
  onResetToDefaults: () => void;
}

export function PlaygroundPresetsStrip({
  onApplyPreset,
  onResetToDefaults,
}: PlaygroundPresetsStripProps): JSX.Element {
  const activePresetId = usePlaygroundStore((s) => s.activePresetId);
  const activePreset = PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Horizontal scrolling chips with snap */}
      <div className="relative w-full">
        {/* Scrollable track */}
        <div
          role="region"
          aria-label="Story presets"
          className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                style={{ scrollSnapAlign: 'start' }}
                className={`group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-caption font-medium shrink-0 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-accent text-white border-accent shadow-sm shadow-accent/20'
                    : 'bg-surface hover:bg-hover border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{preset.title}</span>
                <span
                  className={`text-label px-1.5 py-0.5 rounded text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-elevated text-text-muted group-hover:text-text-secondary'
                  }`}
                >
                  {preset.dataset.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation and explanation line */}
      <div className="flex items-center justify-between text-caption text-text-secondary min-h-[24px] px-1">
        <div className="flex items-center gap-2 truncate">
          {activePreset ? (
            <span className="truncate">
              <strong className="text-text-primary font-semibold">
                Loaded: {activePreset.title}.
              </strong>{' '}
              <span className="text-text-muted">{activePreset.explanation}</span>
            </span>
          ) : (
            <span className="text-text-muted">
              Pick a preset to see a common neural network challenge in action.
            </span>
          )}
        </div>

        {activePreset && (
          <button
            type="button"
            onClick={onResetToDefaults}
            className="inline-flex items-center gap-1 text-caption font-medium text-accent hover:text-accent-light shrink-0 ml-3 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>
        )}
      </div>
    </div>
  );
}
