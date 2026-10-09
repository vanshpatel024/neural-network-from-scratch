import { useMemo } from 'react';
import katex from 'katex';

export interface MathProps {
  math: string;
  block?: boolean;
  className?: string;
  label?: string;
}

export function Math({
  math,
  block = false,
  className = '',
  label,
}: MathProps): JSX.Element {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, block]);

  if (!block) {
    return (
      <span
        className={`inline-flex items-baseline align-baseline px-0.5 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={`my-6 rounded-lg border border-border-subtle bg-surface/50 p-4 ${className}`}
    >
      {label && (
        <div className="mb-2 text-label text-text-muted">
          {label}
        </div>
      )}

      <div className="overflow-x-auto py-2 px-1 text-center font-mono">
        <div
          className="inline-block"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
