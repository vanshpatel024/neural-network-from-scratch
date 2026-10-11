import { useDigitModel } from '@/hooks/useDigitModel';
import { Tooltip } from '@/components/ui/Tooltip';

export function ModelStatusBadge(): JSX.Element {
  const { status, sourceName, errorMessage } = useDigitModel();

  let label = 'Model ready';
  let dotClass = 'bg-success';
  let tooltip = `Default model loaded from ${sourceName}`;

  if (status === 'loading') {
    label = 'Loading model';
    dotClass = 'bg-accent animate-pulse';
    tooltip = 'Downloading and validating network weights...';
  } else if (status === 'custom') {
    label = 'Custom weights';
    dotClass = 'bg-success';
    tooltip = `Running custom model from ${sourceName}`;
  } else if (status === 'error') {
    label = 'Model not found';
    dotClass = 'bg-danger';
    tooltip = errorMessage || 'Could not load weights file.';
  }

  return (
    <Tooltip content={tooltip} placement="bottom">
      <div
        role="status"
        className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-label text-text-secondary select-none"
        aria-label={`Model status: ${label}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass} shrink-0`} aria-hidden="true" />
        <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">{label}</span>
      </div>
    </Tooltip>
  );
}

export default ModelStatusBadge;
