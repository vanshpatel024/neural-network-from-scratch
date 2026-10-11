import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { hasVisitedPage, recordPageVisit } from '@/lib/visitedPages';
import { DesktopNoticeModal } from '@/components/ui/DesktopNoticeModal';

function getRouteMetadata(pathname: string): { title: string; description: string } {
  if (pathname === '/') {
    return {
      title: 'Neural Network From Scratch',
      description:
        'Draw and test digits with a neural network trained from scratch.',
    };
  }
  if (pathname.startsWith('/docs')) {
    return {
      title: 'Documentation | Neural Network From Scratch',
      description:
        'Learn neural networks from the ground up with interactive visual tools and clear math.',
    };
  }
  return {
    title: 'Page Not Found | Neural Network From Scratch',
    description: 'This page does not exist.',
  };
}

function updateMetaDescription(description: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = description;
}

export function AppShell(): JSX.Element {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prefersReducedMotion = useReducedMotion();
  const [announcement, setAnnouncement] = useState<string>('');
  const prevPathnameRef = useRef<string>(location.pathname);

  // 1. Manage Document Title, Meta Description, and polite aria-live announcement
  useEffect(() => {
    const { title, description } = getRouteMetadata(location.pathname);
    document.title = title;
    updateMetaDescription(description);

    setAnnouncement(`${title} loaded`);
  }, [location.pathname]);

  // 2. Manage Scroll and Focus on route change
  useEffect(() => {
    prevPathnameRef.current = location.pathname;

    // Handle scroll restoration on browser Back/Forward (POP)
    if (navigationType === 'POP') {
      return;
    }

    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>('h1');
        if (h1) {
          if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
          h1.focus({ preventScroll: true });
        }
      });
    } else if (location.pathname.startsWith('/docs')) {
      const hash = location.hash.replace(/^#/, '');

      if (!hash) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(() => {
          const h1 = document.querySelector<HTMLElement>('h1');
          if (h1) {
            if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
            h1.focus({ preventScroll: true });
          }
        });
      }
      // When hash is present, useActiveSection handles scrolling once DocsPage mounts
    } else {
      // 404 or other routes
      window.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>('h1');
        if (h1) {
          if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
          h1.focus({ preventScroll: true });
        }
      });
    }
  }, [location.pathname, location.hash, navigationType]);

  const isFirstVisit = !hasVisitedPage(location.pathname);

  useEffect(() => {
    recordPageVisit(location.pathname);
  }, [location.pathname]);

  const shouldAnimate = !prefersReducedMotion && isFirstVisit;

  const pageVariants = shouldAnimate
    ? {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.18, ease: 'easeOut' as const },
      }
    : {
        initial: false as const,
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      };

  return (
    <>
      <DesktopNoticeModal />

      {/* Polite aria-live region to announce route changes to assistive technologies */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={pageVariants.initial}
          animate={pageVariants.animate}
          exit={pageVariants.exit}
          transition={pageVariants.transition}
          className="w-full flex-1 flex flex-col min-w-0"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default AppShell;
