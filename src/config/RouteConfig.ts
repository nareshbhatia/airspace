import { Home } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  path: string;
  title: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
  { path: '/', title: 'Home', icon: Home },
];
