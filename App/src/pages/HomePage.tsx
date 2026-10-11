import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { DigitClassifier } from '@/components/digit/DigitClassifier';
import { LearnHowItWorksRow } from '@/components/digit/LearnHowItWorksRow';
import { preloadDocsPage } from '@/lib/preloadDocs';

export function HomePage(): JSX.Element {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      const handle = (
        window as unknown as { requestIdleCallback: (cb: () => void) => number }
      ).requestIdleCallback(() => {
        preloadDocsPage();
      });
      return () => {
        if ('cancelIdleCallback' in window) {
          (
            window as unknown as { cancelIdleCallback: (id: number) => void }
          ).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(() => {
        preloadDocsPage();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col selection:bg-accent/25 selection:text-text-primary">
      <TopBar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8 lg:pt-8 space-y-10">
        {/* Header Block */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 text-label text-accent font-medium select-none">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive demo</span>
            </div>
          </div>

          <h1
            id="home-main-heading"
            className="text-h1 sm:text-display text-text-primary font-bold tracking-tight"
          >
            Draw a digit. Watch the network decide.
          </h1>

          <p className="max-w-[70ch] text-lead text-text-secondary leading-relaxed">
            A neural network built from scratch with NumPy. It runs in your browser and tells 0 from 1.
          </p>
        </header>

        {/* Interactive Digit Classifier Core (Drawing + Prediction) */}
        <section aria-label="Interactive digit classifier tool">
          <DigitClassifier />
        </section>

        {/* Learn How It Works Row */}
        <LearnHowItWorksRow />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border-subtle py-6 text-caption text-text-muted mt-8 bg-base">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Neural Network From Scratch · &copy; Vansh Patel
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/docs"
              className="inline-flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors font-medium cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Documentation</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
