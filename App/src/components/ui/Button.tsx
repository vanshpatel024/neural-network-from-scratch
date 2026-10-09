import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps): JSX.Element {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none rounded-md';

  const variants: Record<'primary' | 'secondary' | 'subtle', string> = {
    primary: 'bg-accent text-white hover:bg-accent-dark',
    secondary:
      'bg-surface text-text-primary border border-border-subtle hover:bg-elevated hover:border-border-strong',
    subtle: 'text-text-secondary hover:text-text-primary hover:bg-surface',
  };

  const sizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'text-caption px-2.5 py-1.5',
    md: 'text-body px-3.5 py-2',
    lg: 'text-lead px-4 py-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
