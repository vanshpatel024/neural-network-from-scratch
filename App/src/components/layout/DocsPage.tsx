import { useState, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { ProgressBar } from './ProgressBar';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SECTIONS } from '@/sections';

export function DocsPage(): JSX.Element {
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), []);

  const { activeId, scrollToSection } = useActiveSection({
    sectionIds,
  });

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <ProgressBar />

      <Sidebar
        activeId={activeId}
        onSelectSection={scrollToSection}
        isOpenMobile={isOpenMobile}
        onToggleMobile={() => setIsOpenMobile((prev) => !prev)}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      <div className="lg:pl-72 w-full min-w-0">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16 w-full min-w-0">
          {/* Main Document Header */}
          <header className="mb-14 border-b border-border-subtle pb-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1 text-label text-accent">
              <span>Interactive Deep Learning Guide</span>
            </div>
            <h1 className="text-h1 text-text-primary mb-4">
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
              return <Component key={section.id} />;
            })}
          </div>

          {/* Clean Footer */}
          <footer className="mt-20 border-t border-border-subtle pt-8 pb-16 text-caption text-text-muted">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>Neural Network From Scratch · Interactive Guide</p>
              <p>Pure Math and Python Code</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
