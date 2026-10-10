import { useId } from 'react';

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
  const toggleId = useId();

  const handleToggle = (): void => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      onClick={handleToggle}
      className={`inline-flex items-center justify-between gap-2.5 cursor-pointer select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {label && (
        <label
          htmlFor={toggleId}
          className="flex flex-col cursor-pointer pointer-events-none"
        >
          <span className="text-caption font-medium text-text-primary group-hover:text-text-primary transition-colors">
            {label}
          </span>
          {description && (
            <span className="text-caption text-text-muted">
              {description}
            </span>
          )}
        </label>
      )}

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`relative inline-flex h-5 w-9 min-h-[20px] max-h-[20px] min-w-[36px] max-w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed ${
          checked ? 'bg-accent' : 'bg-elevated border-border-subtle'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 shrink-0 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
