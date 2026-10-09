export interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  className?: string;
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  description,
  className = '',
}: ToggleProps): JSX.Element {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {label && (
        <div className="flex flex-col">
          <span className="text-caption font-medium text-text-primary">
            {label}
          </span>
          {description && (
            <span className="text-caption text-text-muted">
              {description}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
          checked ? 'bg-accent' : 'bg-elevated border-border-subtle'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
