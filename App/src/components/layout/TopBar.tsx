import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { preloadDocsPage } from '@/lib/preloadDocs';
import { preloadHomePage } from '@/lib/preloadHome';

export interface TopBarProps {
  badgeSlot?: ReactNode;
}

export function TopBar({ badgeSlot }: TopBarProps): JSX.Element {
  const location = useLocation();
  const pathname = location.pathname;

  const isDocsActive = pathname.startsWith('/docs');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-base">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo & title */}
        <div className="flex items-center min-w-0 mr-2 -ml-1.5">
          <Link
            to="/"
            onMouseEnter={preloadHomePage}
            onFocus={preloadHomePage}
            aria-label="Neural Network From Scratch Home"
            className="group flex min-h-[40px] items-center gap-2 rounded-md px-1.5 py-1 text-body font-semibold tracking-tight text-text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer min-w-0"
          >
            <span
              className="h-2 w-2 rounded-full bg-accent shrink-0 transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            <span className="hidden sm:inline truncate">
              Neural Network From Scratch
            </span>
            <span className="hidden min-[400px]:inline sm:hidden truncate">
              NN From Scratch
            </span>
            <span className="inline min-[400px]:hidden truncate">
              NNFS
            </span>
          </Link>
        </div>

        {/* Navigation links & badge slot */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0 -mr-2 sm:-mr-3">
          <nav aria-label="Main site navigation" className="flex items-center gap-1 sm:gap-2">
            {/* Documentation link */}
            <Link
              to="/docs"
              onMouseEnter={preloadDocsPage}
              onFocus={preloadDocsPage}
              aria-current={isDocsActive ? 'page' : undefined}
              className={`relative inline-flex min-h-[40px] items-center justify-center rounded-sm px-2 sm:px-3 text-caption font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isDocsActive
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="hidden sm:inline">Documentation</span>
              <span className="inline sm:hidden">Docs</span>
              {isDocsActive && (
                <motion.div
                  layoutId="topbar-active-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          </nav>

          {badgeSlot && (
            <div className="shrink-0 flex items-center">
              {badgeSlot}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
