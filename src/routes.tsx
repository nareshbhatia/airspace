import { RootLayout } from './app/RootLayout';
import { HomePage } from './app/routes/home/HomePage';
import { NotFoundPage } from './app/routes/not-found/NotFoundPage';
import { mainNavItems } from './config/RouteConfig';

import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';

const navElementByPath: Record<string, ReactNode> = {
  '/': <HomePage />,
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
