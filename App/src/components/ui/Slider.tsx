import type { ChangeEvent } from 'react';

export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  disabled = false,
  className = '',
}: SliderProps): JSX.Element {
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(parseFloat(e.target.value));
  };

  const displayValue = formatValue
    ? formatValue(value)
    : `${value}${unit ? ` ${unit}` : ''}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-caption font-medium text-text-secondary"
        >
          {label}
        </label>
        <span
          className="text-code-sm font-semibold text-accent tabular-nums rounded border border-border-subtle bg-surface px-2 py-0.5"
          aria-live="polite"
        >
          {displayValue}
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          id={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          className="w-full h-1.5 rounded-lg bg-elevated appearance-none accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        />
      </div>

      <div className="flex justify-between text-code-sm text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
