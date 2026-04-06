import { RootLayout } from './app/RootLayout';
import { FlightpathPage } from './app/routes/flightpath/FlightpathPage';
import { FlightpathOLPage } from './app/routes/flightpath-ol/FlightpathOLPage';
import { MapboxConceptsStandardPage } from './app/routes/mapbox-concepts-standard/MapboxConceptsStandardPage';
import { MapboxConceptsStandardSatellitePage } from './app/routes/mapbox-concepts-standard-satellite/MapboxConceptsStandardSatellitePage';
import { MapboxPlusThreeJsPage } from './app/routes/mapbox-plus-threejs/MapboxPlusThreeJsPage';
import { MarkPlacesPage } from './app/routes/mark-places/MarkPlacesPage';
import { NavigatePage } from './app/routes/navigate/NavigatePage';
import { NotFoundPage } from './app/routes/not-found/NotFoundPage';
import { NycSubwayStopsPage } from './app/routes/nyc-subway-stops/NycSubwayStopsPage';
import { ThreejsConceptsPage } from './app/routes/threejs-concepts/ThreejsConceptsPage';
import { ThreejsDronePage } from './app/routes/threejs-drone/ThreejsDronePage';
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
  '/mapbox-concepts-standard': <MapboxConceptsStandardPage />,
  '/mapbox-concepts-standard-satellite': (
    <MapboxConceptsStandardSatellitePage />
  ),
  '/threejs-concepts': <ThreejsConceptsPage />,
  '/threejs-drone': <ThreejsDronePage />,
  '/mapbox-plus-threejs': <MapboxPlusThreeJsPage />,
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
