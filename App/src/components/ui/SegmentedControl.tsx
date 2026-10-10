import { useId } from 'react';
import { motion } from 'framer-motion';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly (SegmentedControlOption<T> | T)[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>): JSX.Element {
  const instanceId = useId();
  const normalizedOptions: SegmentedControlOption<T>[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div
      role="radiogroup"
      className={`inline-flex max-w-full overflow-x-auto items-center rounded-lg border border-border-subtle bg-surface p-1 ${
        size === 'sm' ? 'gap-0.5' : 'gap-1'
      } ${className}`}
    >
      {normalizedOptions.map((opt) => {
        const isSelected = value === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-md font-medium shrink-0 whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              size === 'sm'
                ? 'px-2.5 py-1 text-caption'
                : 'px-3 py-1.5 text-code-sm'
            } ${
              isSelected
                ? 'text-white font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`segmented-active-${instanceId}`}
                className="absolute inset-0 rounded-md bg-accent shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
