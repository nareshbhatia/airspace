import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './providers/ThemeProvider/ThemeProvider';
import { routes } from './routes';
import './styles/globals.css';

const root = createRoot(document.getElementById('root')!);
const router = createBrowserRouter(routes);

root.render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
