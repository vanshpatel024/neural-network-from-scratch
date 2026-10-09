import type { ReactNode } from 'react';

export interface ControlsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ControlsGrid({
  children,
  columns = 2,
  className = '',
}: ControlsGridProps): JSX.Element {
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 @sm:grid-cols-2',
    3: 'grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3',
    4: 'grid-cols-1 @sm:grid-cols-2 @md:grid-cols-4',
  }[columns];

  return (
    <div className={`grid gap-4 w-full ${columnStyles} ${className}`}>
      {children}
    </div>
  );
}
