import { SECTIONS } from '@/sections';

/**
 * Dev-only validator to ensure:
 * 1. Every registered subsection ID exists in the DOM.
 * 2. Every SubHeading in the DOM is registered in the SECTIONS registry.
 * 3. No duplicate subsection IDs exist across the page.
 */
export function validateSubsections(): void {
  if (typeof document === 'undefined' || !import.meta.env.DEV) {
    return;
  }

  const registeredIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const section of SECTIONS) {
    for (const sub of section.subsections) {
      if (registeredIds.has(sub.id)) {
        duplicateIds.add(sub.id);
      }
      registeredIds.add(sub.id);
    }
  }

  if (duplicateIds.size > 0) {
    console.warn(
      `[Subsections Validation] Duplicate subsection IDs detected in registry:`,
      Array.from(duplicateIds)
    );
  }

  const domHeadings = document.querySelectorAll<HTMLElement>('[data-subsection-heading="true"]');
  const domIds = new Set<string>();

  domHeadings.forEach((el) => {
    const id = el.id;
    if (!id) {
      console.warn('[Subsections Validation] SubHeading element has empty id:', el);
      return;
    }
    domIds.add(id);

    if (!registeredIds.has(id)) {
      console.warn(
        `[Subsections Validation] SubHeading with id="${id}" exists in DOM but is missing from SECTIONS registry.`
      );
    }
  });

  registeredIds.forEach((id) => {
    if (!domIds.has(id)) {
      console.warn(
        `[Subsections Validation] Registered subsection id="${id}" was not found in the DOM.`
      );
    }
  });
}
