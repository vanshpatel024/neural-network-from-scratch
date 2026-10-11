/**
 * Preload helper for lazy-loaded documentation chunks.
 * Calling this behind the scenes warms the browser cache before navigation.
 */
let docsPreloaded = false;

export function preloadDocsPage(): void {
  if (docsPreloaded || typeof window === 'undefined') return;
  docsPreloaded = true;

  // Asynchronously prefetch the DocsPage bundle and its section dependencies
  import('@/pages/DocsPage')
    .then(() => {
      // Warm section chunk cache in background idle time
      import('@/sections').catch(() => {});
    })
    .catch((err) => {
      // Non-fatal if prefetch fails or gets interrupted
      if (import.meta.env.DEV) {
        console.debug('[preloadDocsPage] Prefetch interrupted:', err);
      }
    });
}
