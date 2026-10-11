let homePreloaded = false;

export function preloadHomePage(): void {
  if (homePreloaded || typeof window === 'undefined') return;
  homePreloaded = true;

  import('@/pages/HomePage').catch(() => {});
}
