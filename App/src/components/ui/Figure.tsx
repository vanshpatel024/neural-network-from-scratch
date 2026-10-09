import type { ReactNode } from 'react';
import { Compass } from 'lucide-react';

export interface FigureProps {
  caption?: string;
  tryThis?: readonly string[];
  children: ReactNode;
  className?: string;
}

export function Figure({
  caption,
  tryThis,
  children,
  className = '',
}: FigureProps): JSX.Element {
  return (
    <figure
      className={`my-8 rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 @container container-query max-w-full overflow-hidden ${className}`}
    >
      {/* Visualization Canvas / Interactive Slot */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-base/60 p-4 min-h-[160px] w-full max-w-full">
        {children}
      </div>

      {/* Optional "Try This" prompt list */}
      {tryThis && tryThis.length > 0 && (
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3.5 text-caption">
          <div className="mb-2 flex items-center gap-1.5 text-label text-accent">
            <Compass className="h-3.5 w-3.5" />
            <span>Try This</span>
          </div>
          <ul className="space-y-1.5 text-text-secondary">
            {tryThis.map((prompt, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <figcaption className="mt-3 text-center text-caption text-text-muted sm:text-left">
          Figure: {caption}
        </figcaption>
      )}
    </figure>
  );
}
