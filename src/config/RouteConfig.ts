import {
  Activity,
  Axis3D,
  Box,
  Compass,
  Globe,
  Layers,
  Map,
  MapPin,
  Plane,
  Train,
} from 'lucide-react';

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
  { path: '/flightpath-ol', title: 'Flightpath (OpenLayers)', icon: Map },
  { path: '/zone-editor', title: 'Zone Editor', icon: Layers },
  {
    path: '/mapbox-concepts-standard',
    title: 'Mapbox Concepts (Standard)',
    icon: Globe,
  },
  {
    path: '/mapbox-concepts-standard-satellite',
    title: 'Mapbox Concepts (Satellite)',
    icon: Globe,
  },
  { path: '/threejs-concepts', title: 'Three.js Concepts', icon: Axis3D },
  { path: '/threejs-drone', title: 'Three.js Drone', icon: Axis3D },
  { path: '/mapbox-plus-threejs', title: 'Mapbox + Three.js', icon: Box },
  { path: '/nyc-subway-stops', title: 'NYC Subway Stops', icon: Train },
];
