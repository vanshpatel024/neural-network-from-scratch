import { useState, useEffect, useRef } from 'react';
import type { SectionItem } from '@/sections/types';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useNavigationStore } from '@/lib/navigation';

export interface ProgressiveSectionProps {
  section: SectionItem;
  priority?: boolean;
  staggerIndex?: number;
}

export function ProgressiveSection({
  section,
  priority = false,
  staggerIndex = 0,
}: ProgressiveSectionProps): JSX.Element {
  const [isMounted, setIsMounted] = useState<boolean>(() => {
    if (priority) return true;
    if (typeof window !== 'undefined' && window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#/, '');
      if (cleanHash === section.id || cleanHash.startsWith(`${section.id}--`)) {
        return true;
      }
    }
    return false;
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeId = useNavigationStore((s) => s.activeId);
  const targetId = useNavigationStore((s) => s.targetId);

  // Progressive background idle mounting
  useEffect(() => {
    if (isMounted) return;

    const idleDelay = 300 + staggerIndex * 150;
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, idleDelay);

    return () => clearTimeout(timer);
  }, [isMounted, staggerIndex]);

  // Mount immediately when navigation targets this section or one of its subsections
  useEffect(() => {
    if (isMounted) return;

    const isTargeted =
      activeId === section.id ||
      targetId === section.id ||
      (targetId !== null && targetId.startsWith(`${section.id}--`));

    if (isTargeted) {
      setIsMounted(true);
    }
  }, [activeId, targetId, section.id, isMounted]);

  // Mount via IntersectionObserver when scrolled near viewport
  useEffect(() => {
    if (isMounted) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsMounted(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '800px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMounted]);

  const Component = section.component;

  if (isMounted) {
    return (
      <ErrorBoundary fallbackTitle="Could not load this section.">
        <Component />
      </ErrorBoundary>
    );
  }

  return (
    <div ref={containerRef}>
      <section
        id={section.id}
        tabIndex={-1}
        className="scroll-mt-24 border-b border-border-subtle py-12 first:pt-6 last:border-b-0 last:pb-4 focus:outline-none"
        aria-label={`Loading section ${section.title}`}
      >
        <div className="w-full min-w-0">
          {/* Eyebrow skeleton */}
          <div className="mb-2 h-4 w-28 rounded bg-surface animate-pulse" />

          {/* Title skeleton */}
          <div className="mb-6 h-8 w-64 rounded bg-surface animate-pulse" />

          {/* Paragraph lines skeleton */}
          <div className="space-y-3 mb-6">
            <div className="h-4 w-full rounded bg-surface/70 animate-pulse" />
            <div className="h-4 w-11/12 rounded bg-surface/60 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-surface/40 animate-pulse" />
          </div>

          {/* Widget preview box skeleton */}
          <div className="h-60 sm:h-72 w-full rounded-xl bg-surface/40 border border-border-subtle animate-pulse flex flex-col items-center justify-center p-6 text-center text-caption text-text-muted">
            <div className="h-3 w-32 rounded bg-surface/60 animate-pulse mb-2" />
            <span className="text-[11px] text-text-muted">Loading this section.</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProgressiveSection;
