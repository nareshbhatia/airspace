import { Outlet } from 'react-router';

import { AppHeader } from '../components/AppHeader/AppHeader';
import { AppSidebar } from '../components/AppSidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';

/**
 * Root layout component that wraps the entire application.
 * - The application takes up the full height of the viewport.
 * - The app header is fixed height.
 * - The area below the header takes up the remaining space.
 * - It is divided into
 *   - a sidebar on the left
 *   - the main content area on the right which is scrollable
 *
 * ┌─────────────────────────────┐
 * │          AppHeader          │
 * ├─────────────────────────────┤
 * │ Sidebar │ Main Content Area │
 * │         │     <Outlet>      │
 * └─────────────────────────────┘
 */
export function RootLayout() {
  // `header-height` is used to size the header and set the top of the sidebar
  return (
    <div className="[--header-height:calc(--spacing(12))]">
      <SidebarProvider className="flex flex-col h-svh">
        {/* App Header - Full width above everything */}
        <AppHeader />

        {/* Content below the header */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Full height on the left  */}
          <AppSidebar />

          {/* Main Content Area - Full height on the right and scrollable */}
          <SidebarInset className="overflow-x-hidden overflow-y-auto">
            <Outlet />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
