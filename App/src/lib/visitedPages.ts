/**
 * In-memory registry of visited page pathnames.
 * Enables playing entrance animations strictly on first page visit per session.
 */
const visitedPaths = new Set<string>();

export function hasVisitedPage(pathname: string): boolean {
  return visitedPaths.has(pathname);
}

export function recordPageVisit(pathname: string): void {
  visitedPaths.add(pathname);
}

export function clearVisitedPages(): void {
  visitedPaths.clear();
}
