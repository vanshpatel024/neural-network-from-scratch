import type { ReactNode } from 'react';
import { Info, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';

export type CalloutVariant = 'note' | 'intuition' | 'warning' | 'takeaway';

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Callout({
  variant = 'note',
  title,
  children,
  className = '',
}: CalloutProps): JSX.Element {
  const configs: Record<
    CalloutVariant,
    {
      border: string;
      bg: string;
      text: string;
      icon: typeof Info;
      defaultTitle: string;
    }
  > = {
    note: {
      border: 'border-accent/40',
      bg: 'bg-accent/5',
      text: 'text-accent-light',
      icon: Info,
      defaultTitle: 'Note',
    },
    intuition: {
      border: 'border-accent-light/40',
      bg: 'bg-accent/10',
      text: 'text-accent',
      icon: Lightbulb,
      defaultTitle: 'Intuition',
    },
    warning: {
      border: 'border-warning/40',
      bg: 'bg-warning/5',
      text: 'text-warning',
      icon: AlertTriangle,
      defaultTitle: 'Warning',
    },
    takeaway: {
      border: 'border-success/40',
      bg: 'bg-success/5',
      text: 'text-success',
      icon: CheckCircle2,
      defaultTitle: 'Key Takeaway',
    },
  };

  const config = configs[variant];
  const Icon = config.icon;
  const displayTitle = title ?? config.defaultTitle;

  return (
    <aside
      className={`my-6 rounded-lg border ${config.border} ${config.bg} p-4 text-body ${className}`}
      role="note"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${config.text} mt-0.5`} />
        <div className="space-y-1.5 flex-1">
          {displayTitle && (
            <div className={`text-label ${config.text}`}>
              {displayTitle}
            </div>
          )}
          <div className="text-text-secondary leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
