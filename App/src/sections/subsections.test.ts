import { describe, it, expect } from 'vitest';
import { SECTIONS } from './index';

describe('Sidebar Subsections Data Model & Registry', () => {
  it('has subsections defined for every section in the registry', () => {
    expect(SECTIONS.length).toBeGreaterThan(0);
    for (const section of SECTIONS) {
      expect(Array.isArray(section.subsections)).toBe(true);
      for (const sub of section.subsections) {
        expect(typeof sub.id).toBe('string');
        expect(typeof sub.title).toBe('string');
      }
    }
  });

  it('namespaces subsection IDs with "<section-id>--<slug>"', () => {
    for (const section of SECTIONS) {
      for (const sub of section.subsections) {
        expect(sub.id.startsWith(`${section.id}--`)).toBe(true);
        const slug = sub.id.substring(section.id.length + 2);
        expect(slug.length).toBeGreaterThan(0);
      }
    }
  });

  it('has globally unique subsection IDs across all sections', () => {
    const allIds = new Set<string>();
    for (const section of SECTIONS) {
      for (const sub of section.subsections) {
        expect(allIds.has(sub.id)).toBe(false);
        allIds.add(sub.id);
      }
    }
  });

  it('keeps subsection titles short (<= 28 characters)', () => {
    for (const section of SECTIONS) {
      for (const sub of section.subsections) {
        expect(sub.title.length).toBeLessThanOrEqual(28);
      }
    }
  });

  it('has non-empty subsections for sections with numbered headings', () => {
    const sectionsWithHeadings = [
      'introduction',
      'the-neuron',
      'activation-functions',
      'forward-propagation',
      'loss-functions',
      'gradient-descent',
      'backpropagation',
      'weight-initialization',
      'mini-batch-sgd',
      'gradient-checking',
    ];

    for (const id of sectionsWithHeadings) {
      const sec = SECTIONS.find((s) => s.id === id);
      expect(sec).toBeDefined();
      expect(sec!.subsections.length).toBeGreaterThan(0);
    }
  });
});
