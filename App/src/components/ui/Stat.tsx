export interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning';
  className?: string;
}

export function Stat({
  label,
  value,
  unit,
  subtext,
  variant = 'default',
  className = '',
}: StatProps): JSX.Element {
  const valueColor = {
    default: 'text-text-primary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
  }[variant];

  return (
    <div
      className={`rounded-lg border border-border-subtle bg-surface/70 px-3.5 py-2.5 shadow-sm ${className}`}
    >
      <div className="text-label text-text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`font-mono text-h3 font-bold tracking-tight tabular-nums ${valueColor}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-code-sm text-text-muted">
            {unit}
          </span>
        )}
      </div>
      {subtext && (
        <div className="mt-1 text-caption text-text-secondary leading-tight">
          {subtext}
        </div>
      )}
    </div>
  );
}
