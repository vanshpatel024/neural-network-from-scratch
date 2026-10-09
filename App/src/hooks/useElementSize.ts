import { useState, useEffect, useRef } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

export interface UseElementSizeReturn<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T>;
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): UseElementSizeReturn<T> {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    });

    observer.observe(el);

    // Initial measurement
    const rect = el.getBoundingClientRect();
    setSize({
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    ref,
    width: size.width,
    height: size.height,
  };
}
