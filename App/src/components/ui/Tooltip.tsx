import {
  useState,
  useRef,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ReactElement,
} from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useClick,
  useInteractions,
  FloatingPortal,
  FloatingArrow,
  FloatingDelayGroup,
  useDelayGroup,
  useDelayGroupContext,
  type Placement,
} from '@floating-ui/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: Placement;
  shortcut?: string;
  disabled?: boolean;
  className?: string;
}

export function TooltipProvider({
  children,
  delay = { open: 200, close: 100 },
}: {
  children: ReactNode;
  delay?: number | { open: number; close: number };
}): JSX.Element {
  return <FloatingDelayGroup delay={delay}>{children}</FloatingDelayGroup>;
};

export function Tooltip({
  content,
  children,
  placement = 'top',
  shortcut,
  disabled = false,
  className = '',
}: TooltipProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const arrowRef = useRef<SVGSVGElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const id = useId();

  const delayGroupContext = useDelayGroupContext();
  const isGrouped = Boolean(delayGroupContext);

  const { refs, floatingStyles, context } = useFloating({
    open: !disabled && isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: 'start', padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const { isInstantPhase, currentId } = useDelayGroup(context, { id });

  const hover = useHover(context, {
    move: false,
    delay: isGrouped ? (isInstantPhase ? 0 : { open: 200, close: 100 }) : 200,
  });

  const focus = useFocus(context);
  const click = useClick(context, { ignoreMouse: true }); // Tap-to-toggle on touch screens
  const dismiss = useDismiss(context, { escapeKey: true });
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  // Bind interactions to the trigger element
  const trigger = cloneElement(
    children,
    getReferenceProps({
      ref: refs.setReference,
      ...(children.props as Record<string, unknown>),
    })
  );

  return (
    <>
      {trigger}
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && !disabled && (
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                transition={{
                  duration: shouldReduceMotion || (isInstantPhase && currentId === id) ? 0 : 0.12,
                  ease: 'easeOut',
                }}
                className={`flex items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-caption text-text-primary shadow-xl shadow-black/40 backdrop-blur-md max-w-xs ${className}`}
              >
                <div className="leading-tight">{content}</div>
                {shortcut && (
                  <kbd className="inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-border-subtle bg-elevated px-1 text-code-sm text-text-muted">
                    {shortcut}
                  </kbd>
                )}
                <FloatingArrow
                  ref={arrowRef}
                  context={context}
                  fill="#121215"
                  stroke="#3f3f46"
                  strokeWidth={1}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
