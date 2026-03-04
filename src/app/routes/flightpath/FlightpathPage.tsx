import { FlightpathMap } from './FlightpathMap';
import { FlightpathSidebar } from './FlightpathSidebar';
import { DroneServiceProvider } from '../../../providers/DroneServiceProvider/DroneServiceProvider';
import { cn } from '../../../utils/cn';

/**
 * Flightpath page for flightpath-related operations. Wraps content in
 * DroneServiceProvider and renders a two-panel layout: sidebar + map.
 */
export function FlightpathPage() {
  return (
    <DroneServiceProvider>
      <div className={cn('flex flex-1 min-h-0')}>
        <FlightpathSidebar className="w-[280px] shrink-0" />
        <FlightpathMap className="flex-1 min-w-0" />
      </div>
    </DroneServiceProvider>
  );
}
