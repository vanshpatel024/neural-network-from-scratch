import { describe, it, expect, vi } from 'vitest';
import { docsLink, SECTION_REGISTRY_IDS } from './links';
import { SECTIONS } from '@/sections';

describe('docsLink helper', () => {
  it('generates a section link', () => {
    expect(docsLink('gradient-descent')).toBe('/docs#gradient-descent');
    expect(docsLink('introduction')).toBe('/docs#introduction');
  });

  it('generates a subsection link with full subsection ID', () => {
    expect(
      docsLink('gradient-descent', 'gradient-descent--learning-rate-lab')
    ).toBe('/docs#gradient-descent--learning-rate-lab');
  });

  it('generates a subsection link with short slug', () => {
    expect(docsLink('gradient-descent', 'learning-rate-lab')).toBe(
      '/docs#gradient-descent--learning-rate-lab'
    );
  });

  it('warns in dev when an invalid section or subsection ID is used', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // @ts-expect-error test invalid section id
    docsLink('non-existent-section');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown sectionId "non-existent-section"')
    );

    warnSpy.mockClear();
    docsLink('gradient-descent', 'non-existent-subsection');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown subsectionId "non-existent-subsection"')
    );

    warnSpy.mockRestore();
  });

  it('stays in sync with the canonical SECTIONS definition in src/sections', () => {
    for (const section of SECTIONS) {
      expect(section.id in SECTION_REGISTRY_IDS).toBe(true);
      const regSubs = SECTION_REGISTRY_IDS[section.id as keyof typeof SECTION_REGISTRY_IDS];
      const actualSubs = section.subsections.map((s) => s.id);
      expect([...regSubs]).toEqual(actualSubs);
    }
  });
});
