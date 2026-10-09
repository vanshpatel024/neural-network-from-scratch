import { useEffect, useState, useCallback, useRef } from 'react';

export interface UseActiveSectionOptions {
  sectionIds: readonly string[];
  offset?: number;
}

export interface UseActiveSectionReturn {
  activeId: string;
  setActiveId: (id: string) => void;
  scrollToSection: (id: string) => void;
}

export function useActiveSection({
  sectionIds,
}: UseActiveSectionOptions): UseActiveSectionReturn {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      if (sectionIds.includes(hashId)) {
        return hashId;
      }
    }
    return sectionIds[0] ?? '';
  });

  const isManualScrollRef = useRef<boolean>(false);
  const manualScrollTimerRef = useRef<number | null>(null);

  const scrollToSection = useCallback((id: string): void => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    isManualScrollRef.current = true;
    if (manualScrollTimerRef.current !== null) {
      window.clearTimeout(manualScrollTimerRef.current);
    }

    setActiveId(id);
    window.history.replaceState(null, '', `#${id}`);

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    manualScrollTimerRef.current = window.setTimeout(() => {
      isManualScrollRef.current = false;
    }, 800);
  }, []);

  // Honor initial hash on load
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (hash && sectionIds.includes(hash)) {
      const element = document.getElementById(hash);
      if (element) {
        // slight delay to allow layout to settle
        const timer = window.setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => window.clearTimeout(timer);
      }
    }
  }, [sectionIds]);

  // Scroll-spy with IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || sectionIds.length === 0) {
      return;
    }

    const visibleMap = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollRef.current) {
          return;
        }

        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visibleMap.set(id, entry.intersectionRatio);
          } else {
            visibleMap.delete(id);
          }
        }

        if (visibleMap.size > 0) {
          // Pick the first section from sectionIds that is visible, or highest ratio
          for (const id of sectionIds) {
            if (visibleMap.has(id)) {
              setActiveId((prev) => {
                if (prev !== id) {
                  window.history.replaceState(null, '', `#${id}`);
                  return id;
                }
                return prev;
              });
              break;
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
      if (manualScrollTimerRef.current !== null) {
        window.clearTimeout(manualScrollTimerRef.current);
      }
    };
  }, [sectionIds]);

  return {
    activeId,
    setActiveId,
    scrollToSection,
  };
}
