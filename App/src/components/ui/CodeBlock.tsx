import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getHighlighterInstance } from '@/lib/highlighter';
import { Math as MathEquation } from './Math';
import { Tooltip } from './Tooltip';

export interface ShapeAnnotation {
  symbol: string;
  shape: string;
  note?: string;
}

export interface CodeAnnotation {
  id: string;
  lines: [start: number, end: number]; // inclusive 1-indexed range
  title: string;
  equation: string; // LaTeX formula, rendered with KaTeX
  explanation: ReactNode;
  shapes?: ShapeAnnotation[];
  notes?: ReactNode;
}

export interface CodeBlockProps {
  code: string;
  lang?: string;
  title?: string;
  annotations?: readonly CodeAnnotation[];
  className?: string;
}

interface HighlightedToken {
  content: string;
  color?: string;
}

export function CodeBlock({
  code,
  lang = 'python',
  title,
  annotations = [],
  className = '',
}: CodeBlockProps): JSX.Element {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedEquation, setCopiedEquation] = useState<boolean>(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string>(
    annotations[0]?.id ?? ''
  );
  const [tokensByLine, setTokensByLine] = useState<HighlightedToken[][] | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const cleanCode = code.trim();

  // Keep first annotation selected by default if annotations list changes
  useEffect(() => {
    if (annotations.length > 0 && !annotations.some((a) => a.id === activeAnnotationId)) {
      setActiveAnnotationId(annotations[0]?.id ?? '');
    }
  }, [annotations, activeAnnotationId]);

  useEffect(() => {
    let isCancelled = false;

    async function highlight(): Promise<void> {
      try {
        const highlighter = await getHighlighterInstance();
        try {
          await highlighter.loadLanguage(
            lang as 'python' | 'typescript' | 'bash' | 'json'
          );
        } catch {
          // Ignore if unavailable
        }

        const res = highlighter.codeToTokens(cleanCode, {
          lang: lang as Parameters<typeof highlighter.codeToTokens>[1]['lang'],
          theme: 'vitesse-dark',
        });

        if (!isCancelled) {
          setTokensByLine(res.tokens);
        }
      } catch {
        if (!isCancelled) {
          const plainLines = cleanCode
            .split('\n')
            .map((line) => [{ content: line }]);
          setTokensByLine(plainLines);
        }
      }
    }

    void highlight();

    return () => {
      isCancelled = true;
    };
  }, [cleanCode, lang]);

  const rawLines = cleanCode.split('\n');
  const lineCount = rawLines.length;

  const activeIndex = annotations.findIndex((a) => a.id === activeAnnotationId);
  const activeAnnotation = annotations[activeIndex >= 0 ? activeIndex : 0];

  const handleCopyCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyEquation = async (latex: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopiedEquation(true);
      window.setTimeout(() => setCopiedEquation(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrevStep = (): void => {
    if (annotations.length === 0) return;
    const prevIdx = activeIndex > 0 ? activeIndex - 1 : annotations.length - 1;
    const target = annotations[prevIdx];
    if (target) setActiveAnnotationId(target.id);
  };

  const handleNextStep = (): void => {
    if (annotations.length === 0) return;
    const nextIdx = activeIndex < annotations.length - 1 ? activeIndex + 1 : 0;
    const target = annotations[nextIdx];
    if (target) setActiveAnnotationId(target.id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (annotations.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNextStep();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevStep();
    }
  };

  const handleLineClick = (lineNumber: number): void => {
    const matched = annotations.find(
      (a) => lineNumber >= a.lines[0] && lineNumber <= a.lines[1]
    );
    if (matched) {
      setActiveAnnotationId(matched.id);
    }
  };

  const hasAnnotations = annotations.length > 0;

  return (
    <div
      ref={containerRef}
      tabIndex={hasAnnotations ? 0 : undefined}
      onKeyDown={hasAnnotations ? handleKeyDown : undefined}
      className={`@container container-query group relative my-8 overflow-hidden rounded-xl border border-border-subtle bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {/* Header Bar */}
      <div className="flex h-11 items-center justify-between border-b border-border-subtle bg-base/80 px-4">
        <div className="flex items-center gap-2.5">
          <span className="text-label text-accent font-semibold">
            {lang}
          </span>
          {title && (
            <span className="text-caption text-text-muted">
              · {title}
            </span>
          )}
        </div>

        <Tooltip
          content={copiedCode ? 'Code copied' : 'Copy code'}
          placement="left"
        >
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy code"
            className="flex items-center gap-1.5 rounded border border-border-subtle bg-surface px-2.5 py-1 text-code-sm text-text-muted transition-colors hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {copiedCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Code Column (Full Width Top) */}
      <div className="w-full overflow-x-auto py-3 text-code font-mono min-w-0">
        <div className="min-w-full inline-block">
          {Array.from({ length: lineCount }).map((_, idx) => {
            const lineNumber = idx + 1;
            const isActive =
              activeAnnotation &&
              lineNumber >= activeAnnotation.lines[0] &&
              lineNumber <= activeAnnotation.lines[1];

            const isAnnotated = annotations.some(
              (a) => lineNumber >= a.lines[0] && lineNumber <= a.lines[1]
            );

            const tokens = tokensByLine?.[idx];

            return (
              <div
                key={lineNumber}
                onClick={() => isAnnotated && handleLineClick(lineNumber)}
                className={`group/line flex items-start transition-colors duration-150 ease-out ${
                  isAnnotated ? 'cursor-pointer' : 'cursor-text'
                } ${
                  isActive
                    ? 'border-l-2 border-accent text-accent-light bg-[color-mix(in_srgb,var(--color-surface),var(--color-accent)_12%)] hover:bg-[color-mix(in_srgb,var(--color-surface),var(--color-accent)_16%)]'
                    : 'border-l-2 border-transparent bg-surface hover:bg-[color-mix(in_srgb,var(--color-surface),var(--color-hover)_70%)]'
                }`}
              >
                {/* Sticky Line Number Column */}
                <div
                  className={`sticky left-0 z-10 flex shrink-0 items-center justify-end pr-3 pl-2 select-none w-14 text-right bg-inherit transition-colors duration-150 ease-out border-r ${
                    isActive ? 'border-transparent' : 'border-border-subtle/25'
                  }`}
                >
                  {/* Dot indicator if line belongs to an annotation */}
                  {isAnnotated && !isActive && (
                    <span
                      className="mr-2 h-1.5 w-1.5 rounded-full bg-accent/60"
                      title="Click to view explanation"
                    />
                  )}
                  <span
                    className={`text-code-sm tabular-nums ${
                      isActive
                        ? 'text-accent font-semibold'
                        : isAnnotated
                        ? 'text-text-secondary'
                        : 'text-text-muted'
                    }`}
                  >
                    {lineNumber}
                  </span>
                </div>

                {/* Code Tokens */}
                <div className="flex-1 whitespace-pre pr-6 pl-4 leading-relaxed">
                  {tokens ? (
                    tokens.map((tok, tokIdx) => (
                      <span
                        key={tokIdx}
                        style={tok.color ? { color: tok.color } : undefined}
                      >
                        {tok.content}
                      </span>
                    ))
                  ) : (
                    <span className="text-text-secondary">{rawLines[idx]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation Panel (Full Width Directly Below) */}
      {hasAnnotations && activeAnnotation && (
        <div
          aria-live="polite"
          className="border-t border-border-subtle bg-surface/50 p-4 sm:p-6"
        >
          {/* Stepper Navigation Row - Stable header that never unmounts or flickers */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-3">
              <span className="text-label text-accent font-mono rounded bg-accent/10 px-2 py-0.5">
                Step {activeIndex + 1} of {annotations.length}
              </span>
              <h4 className="text-h4 font-bold text-text-primary">
                {activeAnnotation.title}
              </h4>
            </div>

            {/* Step Control Buttons */}
            <div className="flex items-center gap-1.5">
              <Tooltip content="Previous step (Left arrow)">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  aria-label="Previous step"
                  disabled={activeIndex === 0}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </Tooltip>

              <div className="flex items-center gap-1.5 px-1.5">
                {annotations.map((ann, i) => {
                  const isCurrent = i === activeIndex;
                  return (
                    <Tooltip key={ann.id} content={`Step ${i + 1}: ${ann.title}`}>
                      <button
                        type="button"
                        onClick={() => setActiveAnnotationId(ann.id)}
                        aria-label={`Step ${i + 1}: ${ann.title}`}
                        className={`h-2 rounded-full transition-all duration-300 ease-out ${
                          isCurrent
                            ? 'w-6 bg-accent'
                            : 'w-2 bg-border-strong hover:bg-text-secondary'
                        }`}
                      />
                    </Tooltip>
                  );
                })}
              </div>

              <Tooltip content="Next step (Right arrow)">
                <button
                  type="button"
                  onClick={handleNextStep}
                  aria-label="Next step"
                  disabled={activeIndex === annotations.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </Tooltip>

              {/* Copy Equation Button */}
              <Tooltip
                content={
                  copiedEquation
                    ? 'LaTeX copied'
                    : 'Copy LaTeX'
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    handleCopyEquation(activeAnnotation.equation)
                  }
                  aria-label="Copy LaTeX"
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded border border-border-subtle bg-elevated text-text-muted hover:text-text-primary hover:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  {copiedEquation ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Smooth, Minimalist Content Transition Without Unmounting Gaps */}
          <motion.div
            key={activeAnnotation.id}
            initial={{ opacity: shouldReduceMotion ? 1 : 0.4 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pt-4 space-y-4"
          >
            {/* Analytical KaTeX Equation */}
            <div className="rounded-lg border border-border-subtle bg-base/60 p-3.5 text-center overflow-x-auto">
              <MathEquation math={activeAnnotation.equation} block={false} />
            </div>

            {/* Walkthrough Explanation */}
            <div className="text-body text-text-secondary leading-relaxed">
              {activeAnnotation.explanation}
            </div>

            {/* Compact Tensor Shapes Table */}
            {activeAnnotation.shapes && activeAnnotation.shapes.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border-subtle bg-base/50 p-3">
                <div className="text-label text-text-muted mb-2">
                  Matrix Dimensions
                </div>
                <table className="w-full text-code-sm font-mono text-left">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted">
                      <th className="pb-1.5 pr-4 font-semibold">Symbol</th>
                      <th className="pb-1.5 pr-4 font-semibold">Shape</th>
                      <th className="pb-1.5 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/40 text-text-secondary">
                    {activeAnnotation.shapes.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 pr-4 text-accent font-semibold">
                          {s.symbol}
                        </td>
                        <td className="py-1.5 pr-4 text-text-primary">
                          {s.shape}
                        </td>
                        <td className="py-1.5 text-text-muted">
                          {s.note ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Optional Notes */}
            {activeAnnotation.notes && (
              <div className="rounded-lg border border-border-subtle bg-elevated/70 p-3.5 text-caption text-text-muted leading-relaxed">
                {activeAnnotation.notes}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
