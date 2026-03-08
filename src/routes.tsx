import { RootLayout } from './app/RootLayout';
import { Drone3DPage } from './app/routes/drone-3d/Drone3DPage';
import { FlightpathPage } from './app/routes/flightpath/FlightpathPage';
import { FlightpathOLPage } from './app/routes/flightpath-ol/FlightpathOLPage';
import { Mapbox3DScenePage } from './app/routes/mapbox-3d-scene/Mapbox3DScenePage';
import { MarkPlacesPage } from './app/routes/mark-places/MarkPlacesPage';
import { NavigatePage } from './app/routes/navigate/NavigatePage';
import { NotFoundPage } from './app/routes/not-found/NotFoundPage';
import { NycSubwayStopsPage } from './app/routes/nyc-subway-stops/NycSubwayStopsPage';
import { TrafficMonitorPage } from './app/routes/traffic-monitor/TrafficMonitorPage';
import { ZoneEditorPage } from './app/routes/zone-editor/ZoneEditorPage';
import { mainNavItems } from './config/RouteConfig';

import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';

const navElementByPath: Record<string, ReactNode> = {
  '/': <NavigatePage />,
  '/mark-places': <MarkPlacesPage />,
  '/traffic-monitor': <TrafficMonitorPage />,
  '/flightpath': <FlightpathPage />,
  '/flightpath-ol': <FlightpathOLPage />,
  '/zone-editor': <ZoneEditorPage />,
  '/mapbox-3d-scene': <Mapbox3DScenePage />,
  '/nyc-subway-stops': <NycSubwayStopsPage />,
  '/drone-3d': <Drone3DPage />,
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
