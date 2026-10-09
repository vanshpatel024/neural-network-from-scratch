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

      {/* Main scrolling column */}
      <div className="lg:pl-72">
        <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:py-16">
          {/* Main Document Header */}
          <header className="mb-14 border-b border-border-subtle pb-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-accent font-mono">
              <span>Interactive Deep Learning Architecture</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-5xl mb-4">
              Neural Network From Scratch
            </h1>
            <p className="max-w-[70ch] text-lg text-text-secondary leading-relaxed">
              A comprehensive textbook that teaches artificial neural networks from first
              principles. Explore forward propagation, backpropagation, and stochastic
              gradient descent with live mathematical visualizations and browser-trained
              models.
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
          <footer className="mt-20 border-t border-border-subtle pt-8 pb-16 text-xs text-text-muted">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
              <p>Neural Network From Scratch · Interactive Textbook Edition</p>
              <p>Pure Math & Matrix Computations</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
