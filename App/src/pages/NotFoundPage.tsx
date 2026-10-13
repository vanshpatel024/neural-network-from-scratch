import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col selection:bg-accent/25 selection:text-text-primary">
      <TopBar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-lg mx-auto w-full">
        <div className="mb-6 flex items-center justify-center">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="Neural Network From Scratch"
            className="h-16 w-16 select-none transition-transform duration-300 hover:scale-105"
            width={64}
            height={64}
          />
        </div>

        <h1
          id="notfound-main-heading"
          className="text-h1 text-text-primary font-bold tracking-tight mb-3"
        >
          Page Not Found
        </h1>

        <p className="text-body text-text-secondary mb-8 leading-relaxed">
          We could not find the page you requested. The web address might be mistyped or the page has moved.
        </p>

        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-surface border border-border-subtle px-5 py-2.5 text-label font-medium text-text-primary hover:text-accent hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </main>

      <footer className="border-t border-border-subtle py-6 text-center text-caption text-text-muted">
        <p>Neural Network From Scratch</p>
      </footer>
    </div>
  );
}

export default NotFoundPage;
