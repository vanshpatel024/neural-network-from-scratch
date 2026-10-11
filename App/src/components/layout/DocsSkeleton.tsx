export function DocsSkeleton(): JSX.Element {
  return (
    <div
      className="min-h-screen bg-base text-text-primary relative selection:bg-accent/25 selection:text-text-primary"
      aria-busy="true"
      aria-label="Loading page."
    >
      {/* Mobile Top Bar Skeleton */}
      <div className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-base/90 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2 min-w-0 mr-2">
          <span className="h-2 w-2 rounded-full bg-accent/50 animate-pulse shrink-0" />
          <div className="h-4 w-44 rounded bg-surface animate-pulse" />
        </div>
        <div className="h-9 w-9 rounded-md border border-border-subtle bg-surface animate-pulse shrink-0" />
      </div>

      {/* Desktop Fixed Left Sidebar Skeleton */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border-subtle bg-base lg:flex">
        <div className="flex h-14 items-center border-b border-border-subtle px-6">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-accent/50 animate-pulse shrink-0" />
            <div className="h-4 w-48 rounded bg-surface animate-pulse" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex flex-col gap-6 p-4">
            {/* Back to demo placeholder */}
            <div className="-mt-1 mb-[-12px]">
              <div className="h-8 w-32 rounded-md bg-surface/60 animate-pulse" />
            </div>

            {/* Group 1 */}
            <div className="space-y-1.5">
              <div className="h-3 w-20 px-3 rounded bg-surface/50 animate-pulse" />
              <div className="space-y-0.5">
                <div className="h-8 rounded-md bg-surface/80 animate-pulse" />
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
              </div>
            </div>

            {/* Group 2 */}
            <div className="space-y-1.5">
              <div className="h-3 w-16 px-3 rounded bg-surface/50 animate-pulse" />
              <div className="space-y-0.5">
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
              </div>
            </div>

            {/* Group 3 */}
            <div className="space-y-1.5">
              <div className="h-3 w-16 px-3 rounded bg-surface/50 animate-pulse" />
              <div className="space-y-0.5">
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
                <div className="h-8 rounded-md bg-surface/50 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <div className="lg:pl-72 w-full min-w-0">
        <main className="mx-auto max-w-4xl px-4 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10 lg:px-10 lg:pt-8 w-full min-w-0">
          {/* Header Skeleton */}
          <header className="mb-10 border-b border-border-subtle pb-8 sm:pb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="skeleton-badge-header w-64 max-w-full rounded-full border border-border-subtle bg-surface animate-pulse" />
            </div>

            <div className="h-11 max-sm:h-[87px] w-96 max-w-full rounded bg-surface mb-4 animate-pulse" />

            <div className="space-y-2.5 max-w-[70ch]">
              <div className="h-5 w-full rounded bg-surface/70 animate-pulse" />
              <div className="h-5 w-11/12 rounded bg-surface/60 animate-pulse" />
              <div className="h-5 w-4/5 rounded bg-surface/50 animate-pulse lg:hidden" />
              <div className="h-5 w-full rounded bg-surface/50 animate-pulse sm:hidden" />
              <div className="h-5 w-3/4 rounded bg-surface/50 animate-pulse sm:hidden" />
              <div className="h-5 w-5/6 rounded bg-surface/50 animate-pulse hidden max-[380px]:block" />
            </div>
          </header>

          {/* Section Skeletons */}
          <div className="divide-y divide-border-subtle">
            <div className="py-12 first:pt-6 space-y-6">
              <div className="h-4 w-28 rounded bg-surface animate-pulse" />
              <div className="h-8 w-64 rounded bg-surface animate-pulse" />
              <div className="space-y-2.5 max-w-[70ch]">
                <div className="h-4 w-full rounded bg-surface/70 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-surface/50 animate-pulse" />
              </div>
              <div className="h-64 sm:h-72 w-full rounded-xl bg-surface/40 border border-border-subtle animate-pulse" />
            </div>

            <div className="py-12 last:pb-4 space-y-6">
              <div className="h-4 w-24 rounded bg-surface animate-pulse" />
              <div className="h-8 w-56 rounded bg-surface animate-pulse" />
              <div className="space-y-2.5 max-w-[70ch]">
                <div className="h-4 w-full rounded bg-surface/70 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-surface/50 animate-pulse" />
              </div>
              <div className="h-64 sm:h-72 w-full rounded-xl bg-surface/40 border border-border-subtle animate-pulse" />
            </div>
          </div>

          {/* Footer Skeleton */}
          <footer className="mt-10 border-t border-border-subtle pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-4 w-60 rounded bg-surface/70 animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 rounded bg-surface/70 animate-pulse" />
                <div className="h-8 w-24 rounded-lg bg-surface/70 animate-pulse" />
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default DocsSkeleton;
