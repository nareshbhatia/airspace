import { RootLayout } from './app/RootLayout';
import { NavigatePage } from './app/routes/navigate/NavigatePage';
import { NotFoundPage } from './app/routes/not-found/NotFoundPage';
import { mainNavItems } from './config/RouteConfig';

import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';

const navElementByPath: Record<string, ReactNode> = {
  '/': <NavigatePage />,
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
