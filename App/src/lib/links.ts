/**
 * Section registry mapping for type-safe deep links to documentation.
 * This file is purely static data and types. It must NEVER import
 * React components, Katex, Shiki, Mafs, or Recharts so that the
 * Home page bundle remains small.
 */

export const SECTION_REGISTRY_IDS = {
  'introduction': [
    'introduction--project-goal',
    'introduction--interactive-tools',
    'introduction--code-to-math',
    'introduction--learning-roadmap',
  ],
  'the-neuron': [
    'the-neuron--biology-to-math',
    'the-neuron--interactive-neuron',
    'the-neuron--python-code',
  ],
  'activation-functions': [
    'activation-functions--why-non-linear',
    'activation-functions--interactive-curves',
    'activation-functions--python-code',
  ],
  'forward-propagation': [
    'forward-propagation--pipeline',
    'forward-propagation--interactive-network',
    'forward-propagation--matrix-shapes',
    'forward-propagation--python-code',
  ],
  'loss-functions': [
    'loss-functions--bce',
    'loss-functions--bce-vs-mse',
    'loss-functions--dataset-loss',
    'loss-functions--python-code',
  ],
  'gradient-descent': [
    'gradient-descent--foggy-hill',
    'gradient-descent--update-rule',
    'gradient-descent--python-code',
    'gradient-descent--interactive-1d',
    'gradient-descent--learning-rate-lab',
    'gradient-descent--loss-history',
    'gradient-descent--2d-contour',
    'gradient-descent--minima-saddles',
  ],
  'backpropagation': [
    'backpropagation--chain-rule',
    'backpropagation--pixels-to-inputs',
    'backpropagation--computation-graph',
    'backpropagation--matrix-gradients',
    'backpropagation--network-pass',
    'backpropagation--python-code',
  ],
  'weight-initialization': [
    'weight-initialization--vanishing-signals',
    'weight-initialization--histograms',
    'weight-initialization--xavier-he',
    'weight-initialization--python-code',
  ],
  'mini-batch-sgd': [
    'mini-batch-sgd--batch-vs-sgd',
    'mini-batch-sgd--contour-paths',
    'mini-batch-sgd--variance-rule',
    'mini-batch-sgd--python-code',
  ],
  'gradient-checking': [
    'gradient-checking--finite-diff',
    'gradient-checking--check-tool',
    'gradient-checking--error-score',
    'gradient-checking--code',
  ],
  'train-your-own-model': [],
} as const;

export type SectionId = keyof typeof SECTION_REGISTRY_IDS;

export type SubsectionId<T extends SectionId = SectionId> =
  (typeof SECTION_REGISTRY_IDS)[T][number];

/**
 * Creates a typed deep link to a documentation section or subsection.
 * In development, warns if the section or subsection does not exist in the registry.
 *
 * @example
 * docsLink('gradient-descent') // => '/docs#gradient-descent'
 * docsLink('gradient-descent', 'gradient-descent--learning-rate-lab') // => '/docs#gradient-descent--learning-rate-lab'
 * docsLink('gradient-descent', 'learning-rate-lab') // => '/docs#gradient-descent--learning-rate-lab'
 */
export function docsLink<T extends SectionId>(
  sectionId: T,
  subsectionId?: SubsectionId<T> | string
): string {
  if (import.meta.env.DEV) {
    if (!(sectionId in SECTION_REGISTRY_IDS)) {
      console.warn(`[docsLink] Unknown sectionId "${sectionId}"`);
    } else if (subsectionId) {
      const validSubs = SECTION_REGISTRY_IDS[sectionId] as readonly string[];
      const resolved = subsectionId.includes('--')
        ? subsectionId
        : `${sectionId}--${subsectionId}`;

      if (!validSubs.includes(resolved)) {
        console.warn(
          `[docsLink] Unknown subsectionId "${subsectionId}" for section "${sectionId}"`
        );
      }
    }
  }

  if (!subsectionId) {
    return `/docs#${sectionId}`;
  }

  const targetHash = subsectionId.includes('--')
    ? subsectionId
    : `${sectionId}--${subsectionId}`;

  return `/docs#${targetHash}`;
}
