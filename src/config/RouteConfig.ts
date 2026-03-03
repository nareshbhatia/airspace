import { Activity, Compass, Layers, MapPin, Plane, Train } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  path: string;
  title: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
  { path: '/', title: 'Navigate', icon: Compass },
  { path: '/mark-places', title: 'Mark Places', icon: MapPin },
  { path: '/traffic-monitor', title: 'Traffic Monitor', icon: Activity },
  { path: '/flightpath', title: 'Flightpath', icon: Plane },
  { path: '/zone-editor', title: 'Zone Editor', icon: Layers },
  { path: '/nyc-subway-stops', title: 'NYC Subway Stops', icon: Train },
];
