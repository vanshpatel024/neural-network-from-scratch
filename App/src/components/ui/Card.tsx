import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated';
  children: ReactNode;
}

export function Card({
  variant = 'surface',
  className = '',
  children,
  ...props
}: CardProps): JSX.Element {
  const variants: Record<'surface' | 'elevated', string> = {
    surface: 'bg-surface border-border-subtle',
    elevated: 'bg-elevated border-border-subtle shadow-lg shadow-black/20',
  };

  return (
    <div
      className={`rounded-lg border p-5 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
