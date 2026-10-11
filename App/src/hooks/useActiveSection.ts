import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { SectionItem } from '@/sections/types';
import { useNavigationStore, navigateTo } from '@/lib/navigation';

export interface UseActiveSectionOptions {
  sections: readonly SectionItem[];
  offset?: number;
  subsectionOffset?: number;
}

export interface UseActiveSectionReturn {
  activeId: string;
  activeSubsectionId: string | null;
  setActiveId: (id: string) => void;
  setActiveSubsectionId: (id: string | null) => void;
  scrollToSection: (id: string) => void;
  scrollToSubsection: (id: string) => void;
  scrollToTop: () => void;
}

export function useActiveSection({
  sections,
  offset = 140,
  subsectionOffset = 96,
}: UseActiveSectionOptions): UseActiveSectionReturn {
  const location = useLocation();
  const activeId = useNavigationStore((s) => s.activeId);
  const activeSubsectionId = useNavigationStore((s) => s.activeSubsectionId);
  const setActiveId = useNavigationStore((s) => s.setActiveId);
  const setActiveSubsectionId = useNavigationStore((s) => s.setActiveSubsectionId);

  const scrollToTop = useCallback((): void => {
    navigateTo('top', { source: 'scrollToTop' });
  }, []);

  const scrollToSection = useCallback((id: string): void => {
    navigateTo(id, { source: 'scrollToSection' });
  }, []);

  const scrollToSubsection = useCallback((subsectionId: string): void => {
    navigateTo(subsectionId, { source: 'scrollToSubsection' });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentHash = location.hash.replace(/^#/, '');
    if (!currentHash) return;

    const activeSecId = currentHash.includes('--')
      ? currentHash.split('--')[0]!
      : currentHash;
    const activeSubId = currentHash.includes('--') ? currentHash : null;

    // Immediately set navigation store lock & active IDs so scroll-spy does not override
    useNavigationStore.setState({
      activeId: activeSecId,
      activeSubsectionId: activeSubId,
      isNavigating: true,
      targetId: currentHash,
    });

    const fontPromise =
      document.fonts && document.fonts.ready
        ? Promise.race([
            document.fonts.ready,
            new Promise((r) => setTimeout(r, 150)),
          ])
        : Promise.resolve();

    fontPromise.then(() => {
      requestAnimationFrame(() => {
        navigateTo(currentHash, { source: 'route-hash', behavior: 'smooth' });
      });
    });
  }, [location.hash]);

  // Two-level scroll-spy with IntersectionObserver over sections and subsections
  useEffect(() => {
    if (typeof window === 'undefined' || sections.length === 0) {
      return;
    }

    let rafId: number | null = null;

    const computeActive = (): void => {
      // While locked, scroll-spy must NOT change active section or subsection
      if (useNavigationStore.getState().isNavigating) {
        return;
      }

      // 1. Bottom of page check
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollY + windowHeight >= documentHeight - 60) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          const lastId = lastSection.id;
          const lastSubId =
            lastSection.subsections.length > 0
              ? lastSection.subsections[lastSection.subsections.length - 1]?.id ?? null
              : null;

          useNavigationStore.setState({
            activeId: lastId,
            activeSubsectionId: lastSubId,
          });
          window.history.replaceState(null, '', `#${lastSubId ?? lastId}`);
        }
        return;
      }

      // 2. Top of page check
      if (scrollY < 120) {
        if (useNavigationStore.getState().isNavigating) {
          return;
        }
        const firstSection = sections[0];
        const firstId = firstSection?.id ?? 'introduction';
        useNavigationStore.setState({
          activeId: firstId,
          activeSubsectionId: null,
        });
        if (window.location.hash && !useNavigationStore.getState().targetId) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // 3. Middle of page: find active section
      let matchedSection = sections[0];
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset + 24) {
          matchedSection = section;
        } else {
          break;
        }
      }

      const nextSectionId = matchedSection?.id ?? '';

      // 4. Find active subsection within matchedSection
      let matchedSubId: string | null = null;
      if (matchedSection && matchedSection.subsections.length > 0) {
        for (const sub of matchedSection.subsections) {
          const el = document.getElementById(sub.id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= subsectionOffset + 24) {
            matchedSubId = sub.id;
          } else {
            break;
          }
        }
      }

      useNavigationStore.setState({
        activeId: nextSectionId,
        activeSubsectionId: matchedSubId,
      });
      window.history.replaceState(null, '', `#${matchedSubId ?? nextSectionId}`);
    };

    const handleScrollOrIntersect = (): void => {
      if (useNavigationStore.getState().isNavigating) {
        return;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        computeActive();
        rafId = null;
      });
    };

    const observer = new IntersectionObserver(
      () => {
        handleScrollOrIntersect();
      },
      {
        root: null,
        rootMargin: `-${subsectionOffset}px 0px -50% 0px`,
        threshold: [0, 1.0],
      }
    );

    for (const section of sections) {
      const sectionEl = document.getElementById(section.id);
      if (sectionEl) {
        observer.observe(sectionEl);
      }
      for (const sub of section.subsections) {
        const subEl = document.getElementById(sub.id);
        if (subEl) {
          observer.observe(subEl);
        }
      }
    }

    window.addEventListener('scroll', handleScrollOrIntersect, { passive: true });
    window.addEventListener('resize', handleScrollOrIntersect, { passive: true });

    // Initial pass (only if not navigating and no initial hash)
    if (!useNavigationStore.getState().isNavigating && !location.hash) {
      computeActive();
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollOrIntersect);
      window.removeEventListener('resize', handleScrollOrIntersect);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [sections, offset, subsectionOffset, location.hash]);

  return {
    activeId,
    activeSubsectionId,
    setActiveId,
    setActiveSubsectionId,
    scrollToSection,
    scrollToSubsection,
    scrollToTop,
  };
}
