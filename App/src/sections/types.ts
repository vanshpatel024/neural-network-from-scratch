import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type SectionGroup = 'Foundations' | 'Learning' | 'Training' | 'Playground';

export interface SectionItem {
  id: string;
  title: string;
  group: SectionGroup;
  icon: LucideIcon;
  eyebrow?: string;
  component: ComponentType;
}
