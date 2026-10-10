import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ProgressBar } from './ProgressBar';
import { ErrorBoundary } from './ErrorBoundary';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SECTIONS } from '@/sections';
import { DesktopNoticeModal } from '@/components/ui/DesktopNoticeModal';
import { validateSubsections } from '@/lib/validateSubsections';
import { ArrowUp, BookOpen } from 'lucide-react';

export function DocsPage(): JSX.Element {
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  const {
    activeId,
    activeSubsectionId,
    scrollToSection,
    scrollToSubsection,
    scrollToTop,
  } = useActiveSection({
    sections: SECTIONS,
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      validateSubsections();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackToTop = () => {
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-base text-text-primary relative selection:bg-accent/25 selection:text-text-primary">
      <ProgressBar />
      <DesktopNoticeModal />

      <Sidebar
        activeId={activeId}
        activeSubsectionId={activeSubsectionId}
        onSelectSection={scrollToSection}
        onSelectSubsection={scrollToSubsection}
        onScrollToTop={scrollToTop}
        isOpenMobile={isOpenMobile}
        onToggleMobile={() => setIsOpenMobile((prev) => !prev)}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      <div className="lg:pl-72 w-full min-w-0">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16 w-full min-w-0">
          {/* =========================================================================
              FUTURE HOME PAGE MOUNT POINT
              When multi-page routing is introduced, mount the LandingPage / HomeView here.
              Currently, this route mounts the full interactive Deep Learning Guide.
              ========================================================================= */}
          <div
            id="home-page-mount-placeholder"
            data-placeholder="future-home-page"
            className="hidden"
            aria-hidden="true"
          />

          {/* Main Document Header */}
          <header className="mb-14 border-b border-border-subtle pb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1 text-label text-accent">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Interactive Deep Learning Textbook</span>
              </div>
            </div>

            <h1 className="text-h1 text-text-primary mb-4 font-bold tracking-tight">
              Neural Network From Scratch
            </h1>
            <p className="max-w-[70ch] text-lead text-text-secondary leading-relaxed">
              An interactive guide that teaches neural networks from the ground up.
              Learn how forward propagation and backpropagation work through clear math,
              clean code, and live visual tools.
            </p>
          </header>

          {/* Render All Sections from Registry */}
          <div className="divide-y divide-border-subtle">
            {SECTIONS.map((section) => {
              const Component = section.component;
              return (
                <ErrorBoundary key={section.id} fallbackTitle={`Could not load ${section.title}`}>
                  <Component />
                </ErrorBoundary>
              );
            })}
          </div>

          {/* Minimal Polish Footer */}
          <footer className="mt-20 border-t border-border-subtle pt-8 pb-16 text-caption text-text-muted">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <p className="font-medium text-text-secondary">
                  Neural Network From Scratch · Interactive Visual Guide
                </p>
                <p>Pure TypeScript engine, Web Worker training, and zero dependencies math.</p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleBackToTop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Back to top</span>
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          aria-label="Back to top of page"
          className="fixed bottom-6 right-6 z-40 p-2.5 rounded-full border border-border-strong bg-surface/90 text-text-primary shadow-lg backdrop-blur-md hover:bg-hover hover:border-accent transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default DocsPage;
