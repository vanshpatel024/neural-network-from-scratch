import type { ReactNode } from 'react';
import { GLOSSARY, type GlossaryKey } from '@/lib/glossary';
import { Tooltip } from './Tooltip';
import { Math as MathEquation } from './Math';

export interface TermProps {
  id?: GlossaryKey;
  children?: ReactNode;
  definition?: string;
  latex?: string;
  className?: string;
}

export function Term({
  id,
  children,
  definition,
  latex,
  className = '',
}: TermProps): JSX.Element {
  const entry = id ? GLOSSARY[id] : undefined;

  const displayTerm = children ?? entry?.term ?? id;
  const displayDefinition = definition ?? entry?.definition ?? '';
  const displayLatex = latex ?? entry?.latex;

  const tooltipContent = (
    <div className="space-y-1.5 p-0.5 text-left max-w-[240px]">
      <div className="font-semibold text-accent-light text-label">
        {entry?.term ?? String(displayTerm)}
      </div>
      <div className="text-caption text-text-secondary leading-relaxed">
        {displayDefinition}
      </div>
      {displayLatex && (
        <div className="pt-1 border-t border-border-subtle">
          <MathEquation math={displayLatex} block={false} />
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement="top">
      <span
        tabIndex={0}
        role="button"
        className={`inline-flex items-baseline border-b border-dotted border-text-muted/60 text-text-primary hover:border-accent hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-xs ${className}`}
      >
        {displayTerm}
      </span>
    </Tooltip>
  );
}
