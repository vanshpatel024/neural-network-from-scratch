import type { MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { SECTIONS, SECTION_GROUPS, type SectionItem } from '@/sections';

export interface SidebarProps {
  activeId: string;
  onSelectSection: (id: string) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeId,
  onSelectSection,
  isOpenMobile,
  onToggleMobile,
  onCloseMobile,
}: SidebarProps): JSX.Element {
  const handleItemClick = (
    e: MouseEvent<HTMLAnchorElement>,
    id: string
  ): void => {
    e.preventDefault();
    onSelectSection(id);
    onCloseMobile();
  };

  const navContent = (
    <nav className="flex flex-col gap-6 p-4">
      {SECTION_GROUPS.map((group) => {
        const groupSections = SECTIONS.filter((s) => s.group === group);
        if (groupSections.length === 0) return null;

        return (
          <div key={group} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-semibold tracking-wider text-text-muted uppercase font-mono">
              {group}
            </h3>
            <ul className="space-y-0.5">
              {groupSections.map((item: SectionItem) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;

                return (
                  <li key={item.id} className="relative">
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleItemClick(e, item.id)}
                      className={`group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute inset-0 rounded-md bg-accent/10 border-l-2 border-accent"
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon
                        className={`relative z-10 h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-accent'
                            : 'text-text-muted group-hover:text-text-secondary'
                        }`}
                      />
                      <span className="relative z-10 truncate">{item.title}</span>
                    </a>
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
          href="#introduction"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text-primary hover:text-accent transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>Neural Network From Scratch</span>
        </a>
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label={isOpenMobile ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle bg-surface text-text-secondary hover:text-text-primary transition-colors"
        >
          {isOpenMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close menu"
                  className="rounded p-1 text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{navContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border-subtle bg-base lg:flex">
        <div className="flex h-16 items-center border-b border-border-subtle px-6">
          <a
            href="#introduction"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text-primary hover:text-accent transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>Neural Network From Scratch</span>
          </a>
        </div>
        <div className="flex-1 overflow-y-auto py-2">{navContent}</div>
        <div className="border-t border-border-subtle px-6 py-4">
          <div className="text-[11px] font-mono text-text-muted">
            Textbook Interactive Edition
          </div>
        </div>
      </aside>
    </>
  );
}
