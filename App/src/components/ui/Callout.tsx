import type { ReactNode } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export type CalloutVariant = 'note' | 'tip' | 'warning' | 'danger';

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

export function Callout({
  variant = 'note',
  title,
  children,
}: CalloutProps): JSX.Element {
  const styles: Record<
    CalloutVariant,
    { border: string; bg: string; text: string; icon: typeof Info }
  > = {
    note: {
      border: 'border-accent/40',
      bg: 'bg-accent/5',
      text: 'text-accent-light',
      icon: Info,
    },
    tip: {
      border: 'border-success/40',
      bg: 'bg-success/5',
      text: 'text-success',
      icon: CheckCircle2,
    },
    warning: {
      border: 'border-warning/40',
      bg: 'bg-warning/5',
      text: 'text-warning',
      icon: AlertTriangle,
    },
    danger: {
      border: 'border-danger/40',
      bg: 'bg-danger/5',
      text: 'text-danger',
      icon: AlertCircle,
    },
  };

  const current = styles[variant];
  const Icon = current.icon;

  return (
    <aside
      className={`rounded-lg border ${current.border} ${current.bg} p-4 my-6 text-sm`}
      role="note"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${current.text} mt-0.5`} />
        <div className="space-y-1 text-text-secondary">
          {title && (
            <div className={`font-semibold tracking-wide ${current.text}`}>
              {title}
            </div>
          )}
          <div className="leading-relaxed">{children}</div>
        </div>
      </div>
    </aside>
  );
}
