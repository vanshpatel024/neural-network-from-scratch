import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, X, Monitor } from 'lucide-react';

export function DesktopNoticeModal(): JSX.Element | null {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('dismissed_desktop_notice');
      if (dismissed === 'true') return;
    } catch {
      // Ignore storage error
    }

    const checkWidth = (): void => {
      if (window.innerWidth <= 768) {
        setIsOpen(true);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleDismiss = (): void => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('dismissed_desktop_notice', 'true');
    } catch {
      // Ignore storage error
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-notice-title"
          aria-describedby="desktop-notice-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-base/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm sm:max-w-md rounded-2xl border border-border-strong bg-surface p-6 shadow-2xl space-y-4"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close message"
              className="absolute top-4 right-4 rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon & Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-elevated px-2.5 py-0.5 text-label text-accent">
                <Laptop className="h-3 w-3" />
                <span>Screen Size Tip</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3
                id="desktop-notice-title"
                className="text-h4 font-bold text-text-primary"
              >
                Best Experienced on Desktop
              </h3>
              <p
                id="desktop-notice-desc"
                className="text-body text-text-secondary leading-relaxed"
              >
                This guide includes interactive math models, live code, and dynamic visual diagrams.
                For the best learning experience, open this page on a laptop or desktop computer.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-caption font-semibold text-white shadow-md hover:bg-accent-light transition-colors cursor-pointer"
              >
                Continue on this device
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
