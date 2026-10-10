import type { ReactNode } from 'react';

export function P({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <p
      className={`max-w-[70ch] text-body leading-relaxed text-text-secondary ${className}`}
    >
      {children}
    </p>
  );
}

export function Lead({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <p
      className={`max-w-[70ch] text-lead leading-relaxed text-text-primary/90 font-normal ${className}`}
    >
      {children}
    </p>
  );
}

export function Heading({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <h3
      className={`text-h3 text-text-primary mt-8 mb-3 ${className}`}
    >
      {children}
    </h3>
  );
}

export function SubHeading({
  id,
  children,
  className = '',
}: {
  id: string;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <h3
      id={id}
      tabIndex={-1}
      data-subsection-heading="true"
      className={`text-h3 text-text-primary mt-8 mb-3 scroll-mt-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${className}`}
    >
      {children}
    </h3>
  );
}

export function Subheading({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <h4
      className={`text-h4 text-text-primary mt-6 mb-2 ${className}`}
    >
      {children}
    </h4>
  );
}

export function Ul({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <ul
      className={`max-w-[70ch] space-y-2 text-body text-text-secondary ${className}`}
    >
      {children}
    </ul>
  );
}

export function Li({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <li className={`flex items-start gap-2.5 ${className}`}>
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
  );
}

export function Ol({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <ol
      className={`max-w-[70ch] space-y-2.5 text-body text-text-secondary counter-reset-item ${className}`}
    >
      {children}
    </ol>
  );
}

export function OlItem({
  number,
  children,
  className = '',
}: {
  number: number;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <li className={`flex items-start gap-3 ${className}`}>
      <span className="shrink-0 text-code-sm font-semibold text-accent rounded bg-accent/10 px-1.5 py-0.5 mt-0.5">
        {number}.
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
  );
}

export function InlineCode({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code
      className={`rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-code text-accent-light ${className}`}
    >
      {children}
    </code>
  );
}
