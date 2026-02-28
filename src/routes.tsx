import { RootLayout } from './app/RootLayout';
import { MarkPlacesPage } from './app/routes/mark-places/MarkPlacesPage';
import { NavigatePage } from './app/routes/navigate/NavigatePage';
import { NotFoundPage } from './app/routes/not-found/NotFoundPage';
import { NycSubwayStopsPage } from './app/routes/nyc-subway-stops/NycSubwayStopsPage';
import { TrafficMonitorPage } from './app/routes/traffic-monitor/TrafficMonitorPage';
import { mainNavItems } from './config/RouteConfig';

import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';

const navElementByPath: Record<string, ReactNode> = {
  '/': <NavigatePage />,
  '/mark-places': <MarkPlacesPage />,
  '/traffic-monitor': <TrafficMonitorPage />,
  '/nyc-subway-stops': <NycSubwayStopsPage />,
};

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      ...mainNavItems.map((item) => ({
        path: item.path,
        element: navElementByPath[item.path],
      })),
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
