import { create } from 'zustand';

export interface NavigationOptions {
  source?: string;
  behavior?: ScrollBehavior;
}

export interface NavigationState {
  activeId: string;
  activeSubsectionId: string | null;
  isNavigating: boolean;
  targetId: string | null;
  setActiveId: (id: string) => void;
  setActiveSubsectionId: (id: string | null) => void;
  setLock: (isNavigating: boolean, targetId: string | null) => void;
}

const TOP_OFFSET = 96;

function getInitialNavigationState(): {
  activeId: string;
  activeSubsectionId: string | null;
  isNavigating: boolean;
  targetId: string | null;
} {
  if (typeof window !== 'undefined' && window.location.hash) {
    const raw = window.location.hash.replace('#', '');
    if (raw.includes('--')) {
      const sec = raw.split('--')[0] ?? '';
      return { activeId: sec, activeSubsectionId: raw, isNavigating: true, targetId: raw };
    }
    if (raw) {
      return { activeId: raw, activeSubsectionId: null, isNavigating: true, targetId: raw };
    }
  }
  return { activeId: 'introduction', activeSubsectionId: null, isNavigating: false, targetId: null };
}

const initialNavState = getInitialNavigationState();

export const useNavigationStore = create<NavigationState>((set) => ({
  activeId: initialNavState.activeId,
  activeSubsectionId: initialNavState.activeSubsectionId,
  isNavigating: initialNavState.isNavigating,
  targetId: initialNavState.targetId,
  setActiveId: (id) => set({ activeId: id }),
  setActiveSubsectionId: (id) => set({ activeSubsectionId: id }),
  setLock: (isNavigating, targetId) => set({ isNavigating, targetId }),
}));

let activeCancel: (() => void) | null = null;
let navSequence = 0;

/**
 * Single controlled navigation function.
 * Every sidebar link, subsection link, hash-on-load, and mobile drawer link uses it.
 */
export async function navigateTo(
  id: string,
  options?: NavigationOptions
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Cleanly cancel any previous programmatic navigation animation
  if (activeCancel) {
    activeCancel();
    activeCancel = null;
  }

  const currentSequence = ++navSequence;
  const cleanId = id.replace(/^#/, '');

  let activeSectionId = cleanId;
  let activeSubId: string | null = null;
  if (cleanId === 'top' || cleanId === '') {
    activeSectionId = 'introduction';
    activeSubId = null;
  } else if (cleanId.includes('--')) {
    activeSectionId = cleanId.split('--')[0] ?? cleanId;
    activeSubId = cleanId;
  }

  // Update store immediately so sidebar highlights update smoothly on first frame
  useNavigationStore.setState({
    activeId: activeSectionId,
    activeSubsectionId: activeSubId,
    isNavigating: true,
    targetId: cleanId,
  });

  try {
    // Determine target position
    let targetElement: HTMLElement | null = null;
    let targetTop = 0;

    if (cleanId !== 'top' && cleanId !== '') {
      targetElement = document.getElementById(cleanId);
      if (!targetElement) {
        const startRetry = performance.now();
        while (!targetElement && performance.now() - startRetry < 800) {
          await new Promise((r) => setTimeout(r, 40));
          if (currentSequence !== navSequence) return;
          targetElement = document.getElementById(cleanId);
        }
      }

      if (targetElement) {
        let curr: HTMLElement | null = targetElement;
        while (curr && curr !== document.body) {
          if (curr.getAttribute('data-reveal') === 'true' || curr.style.transform) {
            curr.style.transform = 'none';
            curr.style.opacity = '1';
          }
          curr = curr.parentElement;
        }

        const rect = targetElement.getBoundingClientRect();
        targetTop = Math.max(0, rect.top + window.scrollY - TOP_OFFSET);
      }
    }

    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior =
      options?.behavior ?? (prefersReducedMotion ? 'auto' : 'smooth');

    // Smooth animated scroll or instant jump
    if (behavior === 'auto' || Math.abs(window.scrollY - targetTop) <= 2) {
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      await new Promise((r) => requestAnimationFrame(r));
    } else {
      const startY = window.scrollY;
      const distance = targetTop - startY;

      await new Promise<void>((resolve) => {
        let isSettled = false;
        let rafId: number | null = null;
        const startTime = performance.now();
        // Adaptive duration: 450ms minimum to 650ms maximum for a silky smooth glide
        const duration = Math.min(
          650,
          Math.max(450, Math.round(Math.sqrt(Math.abs(distance)) * 4.5))
        );

        const cleanup = () => {
          if (isSettled) return;
          isSettled = true;
          window.removeEventListener('wheel', handleInterrupt, { capture: true });
          window.removeEventListener('keydown', handleKeyInterrupt, { capture: true });
          window.removeEventListener('touchstart', handleTouchInterrupt, { capture: true });
          if (rafId !== null) cancelAnimationFrame(rafId);
          if (activeCancel === cancelThis) {
            activeCancel = null;
          }
        };

        const cancelThis = () => {
          cleanup();
          resolve();
        };

        activeCancel = cancelThis;

        const handleInterrupt = () => {
          cleanup();
          resolve();
        };

        const SCROLL_KEYS = new Set([
          'ArrowUp',
          'ArrowDown',
          'PageUp',
          'PageDown',
          'Home',
          'End',
          ' ',
          'Space',
        ]);

        const handleKeyInterrupt = (e: KeyboardEvent) => {
          if (SCROLL_KEYS.has(e.key)) {
            handleInterrupt();
          }
        };

        const handleTouchInterrupt = () => {
          if (performance.now() - startTime > 80) {
            handleInterrupt();
          }
        };

        window.addEventListener('wheel', handleInterrupt, { passive: true, capture: true });
        window.addEventListener('keydown', handleKeyInterrupt, { capture: true });
        window.addEventListener('touchstart', handleTouchInterrupt, { passive: true, capture: true });

        // Silky smooth cubic easing: accelerates smoothly and decelerates gracefully to target
        const easeInOutCubic = (t: number): number =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (now: number) => {
          if (isSettled) return;
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const eased = easeInOutCubic(progress);
          const currentPos = Math.round(startY + distance * eased);

          window.scrollTo({ top: currentPos, behavior: 'auto' });

          if (progress < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            cleanup();
            resolve();
          }
        };

        rafId = requestAnimationFrame(step);
      });
    }

    if (currentSequence !== navSequence) return;

    // Re-measure target and correct if diff > 2px (max 3 corrections)
    if (targetElement) {
      for (let c = 0; c < 3; c++) {
        let curr: HTMLElement | null = targetElement;
        while (curr && curr !== document.body) {
          if (curr.getAttribute('data-reveal') === 'true' || curr.style.transform) {
            curr.style.transform = 'none';
            curr.style.opacity = '1';
          }
          curr = curr.parentElement;
        }
        const currentRect = targetElement.getBoundingClientRect();
        const diff = Math.abs(currentRect.top - TOP_OFFSET);
        if (diff <= 2) break;
        const correctedTop = Math.max(0, currentRect.top + window.scrollY - TOP_OFFSET);
        window.scrollTo({ top: correctedTop, behavior: 'auto' });
        await new Promise((r) => requestAnimationFrame(r));
        if (currentSequence !== navSequence) return;
      }
    } else if (cleanId === 'top' || cleanId === '') {
      if (window.scrollY > 2) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }

    if (currentSequence !== navSequence) return;

    // Update URL with history.replaceState, then focus heading with preventScroll: true
    if (cleanId === 'top' || cleanId === '') {
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      window.history.replaceState(null, '', `#${cleanId}`);
    }

    if (targetElement) {
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      targetElement.focus({ preventScroll: true });
    }
  } finally {
    if (currentSequence === navSequence) {
      useNavigationStore.setState({ isNavigating: false, targetId: null });
    }
  }
}
