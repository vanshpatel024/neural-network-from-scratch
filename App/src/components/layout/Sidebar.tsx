import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { SECTIONS, SECTION_GROUPS, type SectionItem, type SubsectionItem } from '@/sections';
import { Tooltip } from '@/components/ui/Tooltip';
import { useNavigationStore, navigateTo } from '@/lib/navigation';

const EASING_CURVE = [0.22, 1, 0.36, 1] as const;

export interface SidebarProps {
  activeId: string;
  activeSubsectionId: string | null;
  onSelectSection?: (id: string) => void;
  onSelectSubsection?: (id: string) => void;
  onScrollToTop?: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeId,
  activeSubsectionId,
  isOpenMobile,
  onToggleMobile,
  onCloseMobile,
}: SidebarProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const isNavigating = useNavigationStore((s) => s.isNavigating);

  // Hover and focus state for non-active section auto-expand
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);

  const hoverOpenTimerRef = useRef<number | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);

  // Auto-follow scroll in sidebar (Rule 8: never touches window scroll, disabled during lock and 2s after user interaction)
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const userInteractedNavUntilRef = useRef<number>(0);

  const handleNavInteraction = () => {
    userInteractedNavUntilRef.current = Date.now() + 2000;
  };

  useEffect(() => {
    if (isNavigating) return;
    if (Date.now() < userInteractedNavUntilRef.current) {
      return;
    }
    const targetId = activeSubsectionId ?? activeId;
    if (!targetId) return;

    const scrollNavElement = (container: HTMLElement | null) => {
      if (!container) return;
      const el = container.querySelector<HTMLElement>(`[data-nav-id="${targetId}"]`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (elRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - elRect.top + 8;
        } else if (elRect.bottom > containerRect.bottom) {
          container.scrollTop += elRect.bottom - containerRect.bottom + 8;
        }
      }
    };

    scrollNavElement(desktopNavRef.current);
    if (isOpenMobile) {
      scrollNavElement(mobileNavRef.current);
    }
  }, [activeId, activeSubsectionId, isOpenMobile, isNavigating]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverOpenTimerRef.current !== null) {
        window.clearTimeout(hoverOpenTimerRef.current);
      }
      if (hoverCloseTimerRef.current !== null) {
        window.clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  const handleSectionMouseEnter = (sectionId: string) => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }

    if (hoveredSectionId === sectionId) return;

    if (hoverOpenTimerRef.current !== null) {
      window.clearTimeout(hoverOpenTimerRef.current);
    }

    // 120ms hover intent delay
    hoverOpenTimerRef.current = window.setTimeout(() => {
      setHoveredSectionId(sectionId);
      hoverOpenTimerRef.current = null;
    }, 120);
  };

  const handleSectionMouseLeave = (sectionId: string) => {
    if (hoverOpenTimerRef.current !== null) {
      window.clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }

    // 200ms close delay preventing flicker
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setHoveredSectionId((curr) => (curr === sectionId ? null : curr));
      hoverCloseTimerRef.current = null;
    }, 200);
  };

  const handleSectionClick = (
    e: MouseEvent<HTMLAnchorElement>,
    id: string,
    isMobile: boolean
  ): void => {
    e.preventDefault();
    userInteractedNavUntilRef.current = Date.now() + 2000;
    if (isMobile) {
      onCloseMobile();
      // Rule 10: wait until drawer finishes closing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          navigateTo(id, { source: 'mobile-drawer' });
        });
      });
    } else {
      navigateTo(id, { source: 'sidebar' });
    }
  };

  const handleSubsectionClick = (
    e: MouseEvent<HTMLAnchorElement>,
    subId: string,
    isMobile: boolean
  ): void => {
    e.preventDefault();
    userInteractedNavUntilRef.current = Date.now() + 2000;
    if (isMobile) {
      onCloseMobile();
      // Rule 10: wait until drawer finishes closing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          navigateTo(subId, { source: 'mobile-drawer' });
        });
      });
    } else {
      navigateTo(subId, { source: 'sidebar' });
    }
  };

  const handleScrollToTopClick = (
    e: MouseEvent<HTMLAnchorElement>,
    isMobile: boolean
  ): void => {
    e.preventDefault();
    userInteractedNavUntilRef.current = Date.now() + 2000;
    if (isMobile) {
      onCloseMobile();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          navigateTo('top', { source: 'mobile-top' });
        });
      });
    } else {
      navigateTo('top', { source: 'desktop-top' });
    }
  };

  const isSectionOpen = (item: SectionItem): boolean => {
    if (item.subsections.length === 0) return false;
    if (item.id === activeId) return true;
    return hoveredSectionId === item.id || focusedSectionId === item.id;
  };

  const sublistVariants: Variants = prefersReducedMotion
    ? {
        open: { opacity: 1, height: 'auto', transition: { duration: 0 } },
        collapsed: { opacity: 0, height: 0, transition: { duration: 0 } },
      }
    : {
        open: {
          opacity: 1,
          height: 'auto',
          transition: {
            height: { duration: 0.22, ease: EASING_CURVE },
            opacity: { duration: 0.2, ease: 'easeOut' },
            staggerChildren: 0.02,
            delayChildren: 0.02,
          },
        },
        collapsed: {
          opacity: 0,
          height: 0,
          transition: {
            height: { duration: 0.16, ease: EASING_CURVE },
            opacity: { duration: 0.12, ease: 'easeIn' },
          },
        },
      };

  const subitemVariants: Variants = prefersReducedMotion
    ? {
        open: { opacity: 1, y: 0, transition: { duration: 0 } },
        collapsed: { opacity: 0, y: 0, transition: { duration: 0 } },
      }
    : {
        open: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.18, ease: EASING_CURVE },
        },
        collapsed: {
          opacity: 0,
          y: -4,
          transition: { duration: 0.12, ease: 'easeIn' },
        },
      };

  const renderNavContent = (isMobile: boolean) => (
    <nav
      aria-label="Documentation sections"
      className="flex flex-col gap-6 p-4"
    >
      {SECTION_GROUPS.map((group) => {
        const groupSections = SECTIONS.filter((s) => s.group === group);
        if (groupSections.length === 0) return null;

        return (
          <div key={group} className="space-y-1.5">
            <h3 className="px-3 text-label text-text-muted">
              {group}
            </h3>
            <ul className="space-y-0.5">
              {groupSections.map((item: SectionItem) => {
                const isActive = activeId === item.id;
                const isOpen = isSectionOpen(item);
                const hasSubsections = item.subsections.length > 0;
                const Icon = item.icon;

                return (
                  <li
                    key={item.id}
                    className="relative"
                    onMouseEnter={isMobile ? undefined : () => handleSectionMouseEnter(item.id)}
                    onMouseLeave={isMobile ? undefined : () => handleSectionMouseLeave(item.id)}
                    onFocusCapture={
                      isMobile
                        ? undefined
                        : () => {
                            setFocusedSectionId(item.id);
                          }
                    }
                    onBlurCapture={
                      isMobile
                        ? undefined
                        : (e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                              setFocusedSectionId((curr) =>
                                curr === item.id ? null : curr
                              );
                            }
                          }
                    }
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleSectionClick(e, item.id, isMobile)}
                      aria-current={isActive && !activeSubsectionId ? 'location' : undefined}
                      data-nav-id={item.id}
                      className={`group relative flex items-center justify-between rounded-md px-3 py-2 text-caption font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                        isActive
                          ? 'text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-md bg-accent/10 border-l-2 border-accent pointer-events-none"
                        />
                      )}
                      <div className="relative z-10 flex min-w-0 items-center gap-2.5 truncate">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-accent'
                              : 'text-text-muted group-hover:text-text-secondary'
                          }`}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>

                      {hasSubsections && (
                        <span
                          aria-hidden="true"
                          className="relative z-10 ml-2 flex h-4 w-4 shrink-0 items-center justify-center text-text-muted transition-colors group-hover:text-text-secondary"
                        >
                          <ChevronRight
                            className={`h-3.5 w-3.5 transition-transform ${
                              prefersReducedMotion ? '' : 'duration-200 ease-out'
                            } ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </span>
                      )}
                    </a>

                    {/* Animated Subsections List */}
                    <AnimatePresence initial={false}>
                      {isOpen && hasSubsections && (
                        <motion.div
                          key={`sublist-${item.id}`}
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={sublistVariants}
                          className="overflow-hidden"
                        >
                          <ul
                            id={`subsections-${item.id}`}
                            aria-label={`${item.title} subsections`}
                            className="relative ml-[19px] pl-3.5 border-l border-border-subtle my-1 space-y-0.5"
                          >
                            {item.subsections.map((sub: SubsectionItem) => {
                              const isActiveSub =
                                activeSubsectionId === sub.id && isActive;

                              return (
                                <motion.li
                                  key={sub.id}
                                  variants={subitemVariants}
                                  className="relative"
                                  data-nav-id={sub.id}
                                >
                                  {isActiveSub && (
                                    <motion.div
                                      initial={{ opacity: 0, scaleY: 0.5 }}
                                      animate={{ opacity: 1, scaleY: 1 }}
                                      transition={{ duration: 0.18, ease: 'easeOut' }}
                                      className="absolute -left-[15px] top-1 bottom-1 w-[2px] bg-accent rounded-full origin-center pointer-events-none"
                                    />
                                  )}
                                  <a
                                    href={`#${sub.id}`}
                                    onClick={(e) =>
                                      handleSubsectionClick(e, sub.id, isMobile)
                                    }
                                    aria-current={
                                      isActiveSub ? 'location' : undefined
                                    }
                                    className={`block py-1 pr-2 text-caption transition-colors line-clamp-2 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                                      isActiveSub
                                        ? 'text-accent font-medium'
                                        : 'text-text-muted hover:text-text-primary'
                                    }`}
                                  >
                                    {sub.title}
                                  </a>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-base/90 px-4 backdrop-blur-md lg:hidden">
        <a
          href="#"
          onClick={(e) => handleScrollToTopClick(e, true)}
          className="flex items-center gap-2 text-body font-semibold tracking-tight text-text-primary hover:text-accent transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>Neural Network From Scratch</span>
        </a>
        <Tooltip
          content={isOpenMobile ? 'Close menu' : 'Open menu'}
          placement="bottom"
        >
          <button
            type="button"
            onClick={onToggleMobile}
            aria-label={isOpenMobile ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpenMobile}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle bg-surface text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {isOpenMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </Tooltip>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-base/80 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border-subtle bg-base shadow-2xl lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
                <span className="text-label text-text-muted">
                  Menu
                </span>
                <Tooltip content="Close menu" placement="bottom">
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    aria-label="Close menu"
                    className="rounded p-1 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
              <div
                ref={mobileNavRef}
                onScroll={handleNavInteraction}
                onTouchStart={handleNavInteraction}
                className="flex-1 overflow-y-auto"
              >
                {renderNavContent(true)}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border-subtle bg-base lg:flex">
        <div className="flex h-16 items-center border-b border-border-subtle px-6">
          <a
            href="#"
            onClick={(e) => handleScrollToTopClick(e, false)}
            className="flex items-center gap-2.5 text-body font-semibold tracking-tight text-text-primary hover:text-accent transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>Neural Network From Scratch</span>
          </a>
        </div>
        <div
          ref={desktopNavRef}
          onScroll={handleNavInteraction}
          onTouchStart={handleNavInteraction}
          className="flex-1 overflow-y-auto py-2"
        >
          {renderNavContent(false)}
        </div>
        <div className="border-t border-border-subtle px-6 py-4">
          <div className="text-caption text-text-muted">
            Interactive Guide
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
