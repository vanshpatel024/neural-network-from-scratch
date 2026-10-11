import { useEffect } from 'react';
import { useDigitModelStore } from '@/store/digitModelStore';

export function useDigitModel() {
  const status = useDigitModelStore((s) => s.status);
  const model = useDigitModelStore((s) => s.model);
  const errorMessage = useDigitModelStore((s) => s.errorMessage);
  const sourceName = useDigitModelStore((s) => s.sourceName);
  const initModel = useDigitModelStore((s) => s.initModel);
  const loadCustomWeights = useDigitModelStore((s) => s.loadCustomWeights);
  const restoreDefaultModel = useDigitModelStore((s) => s.restoreDefaultModel);
  const clearError = useDigitModelStore((s) => s.clearError);

  useEffect(() => {
    initModel();
  }, [initModel]);

  return {
    status,
    model,
    errorMessage,
    sourceName,
    loadCustomWeights,
    restoreDefaultModel,
    clearError,
  };
}
