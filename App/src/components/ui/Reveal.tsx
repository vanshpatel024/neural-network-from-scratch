import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { hasVisitedPage } from '@/lib/visitedPages';

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'none';
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: RevealProps): JSX.Element {
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();
  const isFirstVisit = !hasVisitedPage(location.pathname);

  if (shouldReduceMotion || !isFirstVisit) {
    return <div className={className}>{children}</div>;
  }

  const yOffset = direction === 'up' ? 20 : direction === 'down' ? -20 : 0;

  return (
    <motion.div
      data-reveal="true"
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
