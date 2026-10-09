import type { ReactNode } from 'react';

export interface SectionWrapperProps {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

export function SectionWrapper({
  id,
  title,
  eyebrow,
  children,
}: SectionWrapperProps): JSX.Element {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-border-subtle py-16 first:pt-8 last:border-b-0"
    >
      <div className="w-full min-w-0">
        {eyebrow && (
          <div className="mb-2 text-label text-accent">
            {eyebrow}
          </div>
        )}
        <h2 className="text-h2 text-text-primary mb-6">
          <a
            href={`#${id}`}
            className="group inline-flex items-center gap-2 hover:text-accent transition-colors"
          >
            <span>{title}</span>
            <span
              className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity text-body font-normal select-none"
              aria-hidden="true"
            >
              #
            </span>
          </a>
        </h2>
        <div className="space-y-6 text-body leading-relaxed text-text-secondary">
          {children}
        </div>
      </div>
    </section>
  );
}
