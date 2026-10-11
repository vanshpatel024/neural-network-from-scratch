export function HomeSkeleton(): JSX.Element {
  return (
    <div
      className="min-h-screen bg-base text-text-primary flex flex-col selection:bg-accent/25 selection:text-text-primary"
      aria-busy="true"
      aria-label="Loading home page"
    >
      {/* TopBar Skeleton */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-base px-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0 mr-2">
          <div className="h-2 w-2 rounded-full bg-accent/60 animate-pulse shrink-0" />
          <div className="h-4 w-28 sm:w-44 rounded bg-surface animate-pulse" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="h-4 w-12 sm:w-20 rounded bg-surface animate-pulse" />
          <div className="h-4 w-12 sm:w-24 rounded bg-surface animate-pulse" />
        </div>
      </header>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8 lg:pt-8 space-y-10">
        {/* Header Block Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-36 rounded-full bg-surface animate-pulse" />
          <div className="h-10 w-[480px] max-w-full rounded bg-surface animate-pulse" />
          <div className="h-4 w-[600px] max-w-full rounded bg-surface/70 animate-pulse" />
        </div>

        {/* Row 1: Drawing Pad & Hero Prediction Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: Draw Skeleton */}
          <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-16 rounded bg-surface animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-28 rounded bg-surface/80 animate-pulse" />
                <div className="h-9 w-20 rounded-md bg-surface/80 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-[420px] aspect-square rounded-lg border border-border-subtle bg-base/60 animate-pulse" />
            </div>
            <div className="h-5 w-full max-w-[420px] mx-auto rounded bg-surface/60 animate-pulse" />
          </div>

          {/* Card 2: Prediction Skeleton */}
          <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-24 rounded bg-surface animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-surface/80 animate-pulse" />
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-border-subtle bg-base space-y-3">
              <div className="h-3 w-28 rounded bg-surface/60 animate-pulse" />
              <div className="h-20 w-16 rounded bg-surface animate-pulse my-1" />
              <div className="h-6 w-20 rounded bg-surface animate-pulse" />
              <div className="h-3 w-40 rounded bg-surface/60 animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-5 w-full rounded bg-surface/60 animate-pulse" />
              <div className="h-5 w-full rounded bg-surface/60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Row 2: What the network sees & Try real examples Skeleton */}
        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex items-start gap-4">
              <div className="w-[140px] h-[140px] rounded border border-border-subtle bg-base/60 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-36 rounded bg-surface animate-pulse" />
                <div className="h-3.5 w-full rounded bg-surface/60 animate-pulse" />
                <div className="h-3.5 w-4/5 rounded bg-surface/60 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-32 rounded bg-surface animate-pulse" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded-md bg-surface/80 animate-pulse" />
                <div className="h-10 rounded-md bg-surface/80 animate-pulse" />
                <div className="h-10 rounded-md bg-surface/80 animate-pulse" />
                <div className="h-10 rounded-md bg-surface/80 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Inside the model Skeleton */}
        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 space-y-4">
          <div className="h-5 w-36 rounded bg-surface animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-60 rounded-lg border border-border-subtle bg-base/60 animate-pulse" />
            <div className="h-60 rounded-lg border border-border-subtle bg-base/60 animate-pulse" />
          </div>
        </div>

        {/* Learn How It Works Row Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-44 rounded bg-surface animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 rounded-xl border border-border-subtle bg-surface/80 animate-pulse" />
            <div className="h-28 rounded-xl border border-border-subtle bg-surface/80 animate-pulse" />
            <div className="h-28 rounded-xl border border-border-subtle bg-surface/80 animate-pulse" />
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t border-border-subtle py-6 mt-8 bg-base">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-4 w-60 rounded bg-surface/70 animate-pulse" />
          <div className="h-4 w-28 rounded bg-surface/70 animate-pulse" />
        </div>
      </footer>
    </div>
  );
}

export default HomeSkeleton;
